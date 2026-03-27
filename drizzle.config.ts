import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./data/mbo.sqlite",
  },
} satisfies Config;
