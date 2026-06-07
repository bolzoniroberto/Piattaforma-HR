import { db } from "./db";
import { aiBudget, aiInvocations } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// Gemini 2.5 Flash pricing (USD per 1M tokens), convertito in centesimi EUR
// Approssimazione: 1 USD ≈ 0.93 EUR, arrotondato a 1:1 per semplicità
const PRICING = {
  "gemini-2.5-flash": { inputCentsPerMToken: 8, outputCentsPerMToken: 30 }, // ~$0.075/$0.30 USD
  "gemini-2.5-pro": { inputCentsPerMToken: 125, outputCentsPerMToken: 1000 },
} as const;

const CAP_CENTESIMI = parseInt(process.env.AI_MONTHLY_CAP_CENTS ?? "500", 10); // default €5
const WARN_THRESHOLD = 0.8;

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = PRICING[model as keyof typeof PRICING] ?? PRICING["gemini-2.5-flash"];
  const inputCost = Math.round((tokensIn / 1_000_000) * pricing.inputCentsPerMToken);
  const outputCost = Math.round((tokensOut / 1_000_000) * pricing.outputCentsPerMToken);
  return inputCost + outputCost;
}

export async function checkBudget(): Promise<void> {
  const month = currentMonth();
  const [row] = await db.select().from(aiBudget).where(eq(aiBudget.month, month));
  const spent = row?.spentCentesimi ?? 0;

  if (spent >= CAP_CENTESIMI) {
    throw new Error(`budget_exceeded:${spent}:${CAP_CENTESIMI}`);
  }
}

export async function recordInvocation(params: {
  userId: string;
  scope: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  ok: boolean;
  errorMsg?: string;
}): Promise<void> {
  const month = currentMonth();
  const centesimi = estimateCost(params.model, params.tokensIn, params.tokensOut);

  await db.insert(aiInvocations).values({
    id: nanoid(),
    userId: params.userId,
    scope: params.scope,
    model: params.model,
    tokensIn: params.tokensIn,
    tokensOut: params.tokensOut,
    estimatedCentesimi: centesimi,
    latencyMs: params.latencyMs,
    ok: params.ok,
    errorMsg: params.errorMsg ?? null,
  });

  if (params.ok && centesimi > 0) {
    await db
      .insert(aiBudget)
      .values({ month, spentCentesimi: centesimi, updatedAt: Math.floor(Date.now() / 1000) })
      .onConflictDoUpdate({
        target: aiBudget.month,
        set: {
          spentCentesimi: sql`${aiBudget.spentCentesimi} + ${centesimi}`,
          updatedAt: Math.floor(Date.now() / 1000),
        },
      });

    const [updated] = await db.select().from(aiBudget).where(eq(aiBudget.month, month));
    const newSpent = updated?.spentCentesimi ?? 0;
    if (newSpent >= CAP_CENTESIMI * WARN_THRESHOLD && newSpent - centesimi < CAP_CENTESIMI * WARN_THRESHOLD) {
      console.warn(`[AI BUDGET] Attenzione: 80% del cap mensile raggiunto (${newSpent}/${CAP_CENTESIMI} centesimi)`);
    }
  }
}

export async function getBudgetStatus(): Promise<{
  month: string;
  spentCentesimi: number;
  capCentesimi: number;
  percentUsed: number;
  exceeded: boolean;
}> {
  const month = currentMonth();
  const [row] = await db.select().from(aiBudget).where(eq(aiBudget.month, month));
  const spent = row?.spentCentesimi ?? 0;
  return {
    month,
    spentCentesimi: spent,
    capCentesimi: CAP_CENTESIMI,
    percentUsed: Math.round((spent / CAP_CENTESIMI) * 100),
    exceeded: spent >= CAP_CENTESIMI,
  };
}
