// Validazione delle variabili d'ambiente allo startup (fail-fast).
// Evita che l'app parta con secret mancanti o con i fallback insicuri di sviluppo.
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

// Valori di default noti e insicuri: vietati in produzione.
const INSECURE_DEFAULTS = new Set<string>([
  "dev-secret-mbo-parallelo-2026",
  "mbo-reporting-secret-change-in-production",
]);

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.string().optional(),

  // Sempre obbligatorio: senza, le sessioni non sono firmate in modo sicuro.
  SESSION_SECRET: z
    .string({ required_error: "SESSION_SECRET è obbligatorio" })
    .min(16, "SESSION_SECRET deve essere lungo almeno 16 caratteri"),

  // Obbligatorio in produzione (firma i token di rendicontazione).
  JWT_SECRET: z.string().optional(),

  // Feature opzionali: assenza → warning, non errore.
  GEMINI_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  AI_MONTHLY_CAP_CENTS: z.string().optional(),
  REQUIRE_PASSWORD: z.string().optional(),
  TRUST_PROXY_HOPS: z.string().regex(/^\d+$/, "TRUST_PROXY_HOPS deve essere un intero").optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

let cached: AppConfig | null = null;

export function validateEnv(): AppConfig {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Configurazione ambiente non valida:\n${issues}`);
  }

  const env = parsed.data;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isProd) {
    // In produzione i secret devono esistere e non essere i default di sviluppo.
    if (!env.JWT_SECRET) {
      errors.push("JWT_SECRET è obbligatorio in produzione");
    } else if (INSECURE_DEFAULTS.has(env.JWT_SECRET)) {
      errors.push("JWT_SECRET usa il valore di default insicuro: cambialo");
    }
    if (INSECURE_DEFAULTS.has(env.SESSION_SECRET)) {
      errors.push("SESSION_SECRET usa il valore di default insicuro: cambialo");
    }
  }

  // Feature opzionali: avvisa ma non bloccare.
  if (!env.GEMINI_API_KEY) {
    warnings.push("GEMINI_API_KEY assente: le funzioni AI saranno disabilitate.");
  }
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    warnings.push("Config SMTP incompleta: l'invio email sarà disabilitato.");
  }

  if (errors.length > 0) {
    throw new Error(`Configurazione ambiente non valida:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }

  for (const w of warnings) {
    console.warn(`[config] ${w}`);
  }

  cached = env;
  return env;
}
