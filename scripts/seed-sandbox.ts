/**
 * Seed sandbox — ciclo valutazione + dati demo realistici
 * Idempotente: salta se già esistono dati.
 */
import "dotenv/config";
import { nanoid } from "nanoid";
import { competenciesStorage } from "../server/competenciesStorage";
import { storage } from "../server/storage";
import { initializeDatabase, db } from "../server/db";
import {
  userCompetencyModelAssignments,
  selfAssessments,
  peerFeedbackRequests,
  peerFeedbacks,
  managerEvaluations,
  developmentPlans,
} from "../shared/schema";
import { eq, and } from "drizzle-orm";

initializeDatabase();

const ts = (y: number, m: number, d: number) =>
  Math.floor(new Date(y, m, d).getTime() / 1000);

const RATINGS = [2, 3, 3, 4, 4, 4, 5]; // distribuzione realistica
function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SELF_COMMENTS: Record<number, string[]> = {
  2: ["Sto lavorando per migliorare in quest'area.", "Riconosco di dover sviluppare questa competenza."],
  3: ["Ho raggiunto un livello adeguato ma c'è margine di crescita.", "Mi considero nella media su questo aspetto."],
  4: ["Mi sento solido su questa competenza.", "Ho ricevuto feedback positivi in quest'area."],
  5: ["È uno dei miei punti di forza principali.", "Ritengo di eccellere in questo ambito."],
};

const PEER_COMMENTS: Record<number, string[]> = {
  2: ["Potrebbe migliorare su questo aspetto.", "Ho notato qualche difficoltà in quest'area."],
  3: ["Performance nella norma.", "Buona base, con spazio di crescita."],
  4: ["Molto competente in quest'area.", "Dimostrazione chiara di questa competenza."],
  5: ["Punto di riferimento per il team.", "Eccelle su questo aspetto, esempio per tutti."],
};

const DEVELOPMENT_ACTIONS = [
  "Partecipare a workshop di leadership avanzata",
  "Seguire corso certificato in project management",
  "Affiancamento senior su negoziazione commerciale",
  "Frequentare training comunicazione efficace",
  "Coaching individuale su gestione del team",
  "Partecipare a programma mentoring interno",
  "Studiare framework OKR e applicarlo al team",
  "Seguire corso su analisi dei dati e reporting",
];

async function main() {
  console.log("🏖  Seed sandbox avviato\n");

  // ── 1. Recupera modelli e competenze ────────────────────────────────────────
  const models = await competenciesStorage.getCompetencyModels();
  if (models.length === 0) {
    console.error("❌ Nessun modello competenze trovato. Esegui prima seedCompetencies.ts");
    process.exit(1);
  }

  const modelByPersona: Record<string, string> = {};
  for (const m of models) {
    if (m.personaType) modelByPersona[m.personaType] = m.id;
  }

  console.log(`✓ Trovati ${models.length} modelli: ${Object.keys(modelByPersona).join(", ")}`);

  // ── 2. Ciclo di valutazione ──────────────────────────────────────────────────
  const existing = await competenciesStorage.getEvaluationCycles({ status: "active" });
  let cycle = existing[0];

  if (cycle) {
    console.log(`✓ Ciclo già esistente: "${cycle.name}" (${cycle.id})`);
  } else {
    const y = 2026;
    cycle = await competenciesStorage.createEvaluationCycle({
      name: "Performance Review 2026",
      year: y,
      status: "active",
      selfAssessmentStart: ts(y, 0, 15),
      selfAssessmentEnd: ts(y, 2, 31),
      peerFeedbackStart: ts(y, 1, 1),
      peerFeedbackEnd: ts(y, 3, 15),
      managerEvaluationStart: ts(y, 3, 1),
      managerEvaluationEnd: ts(y, 4, 30),
      feedbackDeliveryStart: ts(y, 5, 1),
      feedbackDeliveryEnd: ts(y, 5, 30),
      enable360Feedback: true,
      createdBy: "admin-001",
    });
    console.log(`✓ Ciclo creato: "${cycle.name}"`);
  }

  // ── 3. Recupera utenti ───────────────────────────────────────────────────────
  const allUsers = await storage.getAllUsers();
  const employees = allUsers.filter((u) => u.role === "employee");
  const managers = allUsers.filter((u) => u.role === "manager");
  const admin = allUsers.find((u) => u.id === "admin-001");

  console.log(`✓ Utenti: ${employees.length} employee, ${managers.length} manager`);

  // ── 4. Assegna modello competenze a ogni utente ──────────────────────────────
  console.log("\n📋 Assegnazione modelli competenze...");

  const personaMap: Record<string, string> = {
    "admin-001": "executive",
  };
  managers.forEach((m) => (personaMap[m.id] = "manager"));
  employees.forEach((e, i) => (personaMap[e.id] = i % 2 === 0 ? "professional" : "expert"));

  for (const [userId, persona] of Object.entries(personaMap)) {
    const modelId = modelByPersona[persona] ?? modelByPersona["professional"];
    if (!modelId) continue;

    // Idempotente: controlla se già assegnato
    const existing = await db
      .select()
      .from(userCompetencyModelAssignments)
      .where(
        and(
          eq(userCompetencyModelAssignments.userId, userId),
          eq(userCompetencyModelAssignments.isCurrent, true),
        ),
      );

    if (existing.length === 0) {
      await competenciesStorage.createUserCompetencyModelAssignment({
        userId,
        competencyModelId: modelId,
        assignedBy: "admin-001",
        isCurrent: true,
      });
    }
  }
  console.log(`✓ ${Object.keys(personaMap).length} utenti assegnati`);

  // ── 5. Autovalutazioni per tutti gli employee ────────────────────────────────
  console.log("\n📝 Autovalutazioni...");
  let selfCount = 0;

  for (const emp of employees) {
    const comps = await competenciesStorage.getCompetenciesByUserId(emp.id);
    if (comps.length === 0) continue;

    for (const comp of comps) {
      const rating = rnd(RATINGS);
      const comment = rnd(SELF_COMMENTS[rating]);

      await competenciesStorage.createOrUpdateSelfAssessment({
        cycleId: cycle.id,
        userId: emp.id,
        competencyId: comp.id,
        rating,
        comment,
        status: "submitted",
      });
      selfCount++;
    }
    await competenciesStorage.submitSelfAssessments(cycle.id, emp.id);
  }
  console.log(`✓ ${selfCount} autovalutazioni create`);

  // ── 6. Peer feedback ─────────────────────────────────────────────────────────
  console.log("\n🤝 Peer feedback...");
  let peerReqCount = 0;
  let peerFbCount = 0;

  for (let i = 0; i < employees.length; i++) {
    const requester = employees[i];
    // Ogni employee chiede feedback a 2 colleghi
    const peers = employees.filter((e) => e.id !== requester.id).slice(0, 2);

    for (const peer of peers) {
      // Idempotente: verifica se esiste già
      const existingReqs = await competenciesStorage.getPeerFeedbackRequests(
        cycle.id, requester.id, "sent",
      );
      const alreadyRequested = existingReqs.some((r) => r.peerUserId === peer.id);
      if (alreadyRequested) continue;

      const reqs = await competenciesStorage.createPeerFeedbackRequest(
        cycle.id, requester.id, [peer.id],
      );
      const req = reqs[0];
      peerReqCount++;

      // Il peer risponde con valutazioni per ogni competenza del requester
      const comps = await competenciesStorage.getCompetenciesByUserId(requester.id);
      for (const comp of comps) {
        const rating = rnd(RATINGS);
        const comment = rnd(PEER_COMMENTS[rating]);
        await competenciesStorage.createPeerFeedback({
          requestId: req.id,
          cycleId: cycle.id,
          requestorUserId: requester.id,
          peerUserId: peer.id,
          competencyId: comp.id,
          year: cycle.year,
          rating,
          comment,
        });
        peerFbCount++;
      }

      await competenciesStorage.updatePeerFeedbackRequestStatus(req.id, "completed");
    }
  }
  console.log(`✓ ${peerReqCount} richieste, ${peerFbCount} valutazioni peer`);

  // ── 7. Valutazioni manager ───────────────────────────────────────────────────
  console.log("\n👔 Valutazioni manager...");
  let managerEvalCount = 0;

  // Ogni manager valuta i propri dipendenti (usando "manager-001" per tutti se non assegnati)
  const managerId = managers[0]?.id ?? "admin-001";

  for (const emp of employees) {
    const comps = await competenciesStorage.getCompetenciesByUserId(emp.id);
    if (comps.length === 0) continue;

    for (const comp of comps) {
      const rating = rnd(RATINGS);
      await competenciesStorage.createOrUpdateManagerEvaluation({
        cycleId: cycle.id,
        employeeUserId: emp.id,
        managerUserId: managerId,
        competencyId: comp.id,
        rating,
        comment: `Valutazione basata su osservazioni dirette del periodo ${cycle.year}.`,
        status: "submitted",
      });
      managerEvalCount++;
    }

    // Piano di sviluppo
    const existingPlan = await competenciesStorage.getDevelopmentPlan(cycle.id, emp.id);
    if (!existingPlan) {
      const actions = [rnd(DEVELOPMENT_ACTIONS), rnd(DEVELOPMENT_ACTIONS)];
      await competenciesStorage.createDevelopmentPlan({
        cycleId: cycle.id,
        employeeUserId: emp.id,
        managerUserId: managerId,
        developmentGoals: `Crescita professionale nel ${cycle.year + 1} con focus su competenze trasversali`,
        actionItems: JSON.stringify(actions.map((a) => ({ action: a, deadline: `${cycle.year + 1}-06-30`, status: "pending" }))),
        managerNotes: "Comunicazione efficace, orientamento al risultato. Sviluppare leadership e gestione del cambiamento.",
        status: "agreed",
        competenciesToDevelop: JSON.stringify([]),
      });
    }
  }
  console.log(`✓ ${managerEvalCount} valutazioni manager + ${employees.length} piani di sviluppo`);

  console.log("\n✅ Sandbox pronto!");
  console.log(`   Ciclo: "${cycle.name}" (${cycle.id})`);
  console.log(`   Usa questo cycleId nelle API o per testare le pagine di valutazione.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
