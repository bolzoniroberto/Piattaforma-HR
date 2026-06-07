import { db } from "./db";
import { aiSessions, aiMessages } from "@shared/schema";
import { eq, asc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { callAI } from "./aiService";

const MAX_TURNS = 6;

// ─── Tipi pubblici ────────────────────────────────────────────────────────────

export type AiScope = "assign" | "eval";

export interface QuestionPayload {
  key: string;
  text: string;
  type: "free" | "choice" | "number";
  choices?: string[];
  optional?: boolean;
}

export interface ProposalObjective {
  dictionaryId: string;
  weight: number; // multiplo di 5, somma=100
  deadline?: number; // unix timestamp
  rationale: string;
}

export interface ProposalAssign {
  objectives: ProposalObjective[];
  note: string;
}

export interface ProposalEval {
  executiveSummary: string;
  strengths: string[];
  developmentAreas: string[];
  mboHighlights: string;
  competencyGaps: string[];
  peerThemes: string[];
  proposedDevelopmentActions: string[];
  riskFlags: string[];
  tone: string;
}

export type Proposal = ProposalAssign | ProposalEval;

export interface TurnResult {
  sessionId: string;
  state: "questioning" | "ready" | "finalized";
  question?: QuestionPayload;
  proposal?: Proposal;
  turnCount: number;
}

// ─── Dati di contesto dal DB ──────────────────────────────────────────────────

async function loadAssignContext(targetUserId: string, cycleId?: string) {
  const { storage } = await import("./storage");
  const user = await storage.getUser(targetUserId);
  const dictionary = await storage.getObjectivesDictionary();
  const clusters = await storage.getIndicatorClusters();
  const businessFunctions = await storage.getBusinessFunctions();
  return { user, dictionary, clusters, businessFunctions };
}

async function loadEvalContext(targetUserId: string, cycleId: string) {
  const { competenciesStorage } = await import("./competenciesStorage");
  const { storage } = await import("./storage");
  const user = await storage.getUser(targetUserId);
  return { user, cycleId };
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

const TURN_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    action: { type: "string", enum: ["ask", "propose"] },
    question: {
      type: "object",
      nullable: true,
      properties: {
        key: { type: "string" },
        text: { type: "string" },
        type: { type: "string", enum: ["free", "choice", "number"] },
        choices: { type: "array", items: { type: "string" }, nullable: true },
        optional: { type: "boolean", nullable: true },
      },
    },
    factsUpdate: { type: "object", nullable: true },
    proposalAssign: {
      type: "object",
      nullable: true,
      properties: {
        objectives: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dictionaryId: { type: "string" },
              weight: { type: "number" },
              rationale: { type: "string" },
              deadline: { type: "number", nullable: true },
            },
          },
        },
        note: { type: "string" },
      },
    },
    proposalEval: {
      type: "object",
      nullable: true,
      properties: {
        executiveSummary: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        developmentAreas: { type: "array", items: { type: "string" } },
        mboHighlights: { type: "string" },
        competencyGaps: { type: "array", items: { type: "string" } },
        peerThemes: { type: "array", items: { type: "string" } },
        proposedDevelopmentActions: { type: "array", items: { type: "string" } },
        riskFlags: { type: "array", items: { type: "string" } },
        tone: { type: "string" },
      },
    },
  },
  required: ["action"],
};

function buildAssignSystemPrompt(context: Awaited<ReturnType<typeof loadAssignContext>>): string {
  const { user, dictionary, clusters, businessFunctions } = context;
  const dictSummary = dictionary
    .slice(0, 40)
    .map((o) => `- id:${o.id} | "${o.title}" | tipo:${o.objectiveType} | cluster:${o.indicatorClusterId}`)
    .join("\n");

  return `Sei un assistente HR specializzato in sistemi MBO (Management by Objectives).
Il tuo compito è aiutare il manager ad assegnare obiettivi al dipendente ${user?.firstName ?? ""} ${user?.lastName ?? ""}.
Profilo dipendente: ruolo=${user?.role ?? "?"}, dipartimento=${user?.department ?? "?"}, MBO%=${user?.mboPercentage ?? "?"}%.

Dizionario obiettivi disponibile (max 40 mostrati):
${dictSummary}

Regole proposta:
- Proponi 3-5 obiettivi
- Somma pesi = 100, multipli di 5
- Scegli SOLO id dal dizionario sopra
- Priorità agli obiettivi che corrispondono ai fatti raccolti
- Output in italiano

Conduci la conversazione con domande mirate (massimo 6 turni totali).
Quando hai abbastanza informazioni, proponi (action=propose con proposalAssign).`;
}

function buildEvalSystemPrompt(context: Awaited<ReturnType<typeof loadEvalContext>>): string {
  const { user } = context;
  return `Sei un assistente HR specializzato in valutazione della performance.
Stai aiutando il manager a scrivere la scheda di valutazione per ${user?.firstName ?? ""} ${user?.lastName ?? ""}.

Il tuo compito è fare domande chiave per capire il punto di vista del manager, poi generare una bozza di scheda strutturata.
Conduci la conversazione (massimo 6 turni). Quando hai abbastanza informazioni, proponi (action=propose con proposalEval).
Sii empatico ma professionale. Output sempre in italiano.`;
}

function buildTurnPrompt(
  scope: AiScope,
  collectedFacts: Record<string, unknown>,
  history: { role: string; content: string }[],
  turnCount: number
): string {
  const historyText = history
    .map((m) => `[${m.role === "agent" ? "ASSISTENTE" : "MANAGER"}]: ${m.content}`)
    .join("\n");

  const forcePropose = turnCount >= MAX_TURNS - 1;

  return `Fatti raccolti finora: ${JSON.stringify(collectedFacts)}

Storia conversazione:
${historyText || "(inizio conversazione)"}

Turno attuale: ${turnCount + 1}/${MAX_TURNS}
${forcePropose ? "IMPORTANTE: hai raggiunto il limite di domande. Devi fare la proposta finale ora (action=propose)." : ""}

Rispondi in JSON secondo lo schema fornito.`;
}

// ─── Funzioni pubbliche ───────────────────────────────────────────────────────

export async function startSession(params: {
  userId: string;
  scope: AiScope;
  targetUserId: string;
  cycleId?: string;
}): Promise<TurnResult> {
  const sessionId = nanoid();

  await db.insert(aiSessions).values({
    id: sessionId,
    userId: params.userId,
    scope: params.scope,
    targetUserId: params.targetUserId,
    cycleId: params.cycleId ?? null,
    state: "questioning",
    turnCount: 0,
    collectedFacts: "{}",
    proposal: null,
  });

  return runTurn(sessionId, params.userId, null);
}

export async function answerTurn(params: {
  sessionId: string;
  userId: string;
  answer: string;
  questionKey: string;
}): Promise<TurnResult> {
  const [session] = await db.select().from(aiSessions).where(eq(aiSessions.id, params.sessionId));
  if (!session) throw new Error("Sessione non trovata");
  if (session.state !== "questioning") throw new Error("Sessione non in stato questioning");

  // Salva risposta utente
  await db.insert(aiMessages).values({
    id: nanoid(),
    sessionId: params.sessionId,
    role: "user",
    content: params.answer,
    questionKey: params.questionKey,
  });

  return runTurn(params.sessionId, params.userId, params.answer);
}

async function runTurn(sessionId: string, userId: string, lastAnswer: string | null): Promise<TurnResult> {
  const [session] = await db.select().from(aiSessions).where(eq(aiSessions.id, sessionId));
  if (!session) throw new Error("Sessione non trovata");

  const history = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.sessionId, sessionId))
    .orderBy(asc(aiMessages.createdAt));

  const collectedFacts: Record<string, unknown> = JSON.parse(session.collectedFacts || "{}");
  const scope = session.scope as AiScope;

  // Carica contesto
  let systemPrompt: string;
  if (scope === "assign") {
    const ctx = await loadAssignContext(session.targetUserId!, session.cycleId ?? undefined);
    systemPrompt = buildAssignSystemPrompt(ctx);
  } else {
    const ctx = await loadEvalContext(session.targetUserId!, session.cycleId ?? "");
    systemPrompt = buildEvalSystemPrompt(ctx);
  }

  const turnPrompt = buildTurnPrompt(scope, collectedFacts, history, session.turnCount);

  const result = await callAI({
    userId,
    scope: `ai_session_${scope}`,
    prompt: turnPrompt,
    systemInstruction: systemPrompt,
    model: "fast",
    responseSchema: TURN_RESPONSE_SCHEMA,
  });

  const parsed = result.parsed as any;
  const newFacts = { ...collectedFacts, ...(parsed?.factsUpdate ?? {}) };
  const newTurnCount = session.turnCount + 1;

  if (parsed?.action === "propose") {
    const proposal = scope === "assign" ? parsed.proposalAssign : parsed.proposalEval;

    await db
      .update(aiSessions)
      .set({
        state: "ready",
        turnCount: newTurnCount,
        collectedFacts: JSON.stringify(newFacts),
        proposal: JSON.stringify(proposal),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(aiSessions.id, sessionId));

    return {
      sessionId,
      state: "ready",
      proposal,
      turnCount: newTurnCount,
    };
  }

  // action === "ask"
  const question: QuestionPayload = parsed?.question ?? {
    key: "generic",
    text: "Puoi fornire ulteriori dettagli?",
    type: "free",
  };

  // Salva domanda agente
  await db.insert(aiMessages).values({
    id: nanoid(),
    sessionId,
    role: "agent",
    content: question.text,
    questionKey: question.key,
  });

  await db
    .update(aiSessions)
    .set({
      turnCount: newTurnCount,
      collectedFacts: JSON.stringify(newFacts),
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(aiSessions.id, sessionId));

  return {
    sessionId,
    state: "questioning",
    question,
    turnCount: newTurnCount,
  };
}

export async function getSession(sessionId: string): Promise<TurnResult | null> {
  const [session] = await db.select().from(aiSessions).where(eq(aiSessions.id, sessionId));
  if (!session) return null;

  const lastMsg = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.sessionId, sessionId))
    .orderBy(asc(aiMessages.createdAt));

  const lastAgentMsg = [...lastMsg].reverse().find((m) => m.role === "agent");

  const question: QuestionPayload | undefined = lastAgentMsg
    ? { key: lastAgentMsg.questionKey ?? "generic", text: lastAgentMsg.content, type: "free" }
    : undefined;

  return {
    sessionId,
    state: session.state as TurnResult["state"],
    question: session.state === "questioning" ? question : undefined,
    proposal: session.proposal ? JSON.parse(session.proposal) : undefined,
    turnCount: session.turnCount,
  };
}

export async function finalizeSession(sessionId: string): Promise<void> {
  await db
    .update(aiSessions)
    .set({ state: "finalized", updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(aiSessions.id, sessionId));
}
