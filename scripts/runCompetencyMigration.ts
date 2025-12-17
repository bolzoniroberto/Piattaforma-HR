import { neon } from "@neondatabase/serverless";
import { readFile } from "fs/promises";
import { join } from "path";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log("🚀 Running competency system migration...");

    const migrationPath = join(process.cwd(), "db/migrations/006_add_competency_system.sql");
    const migrationSQL = await readFile(migrationPath, "utf-8");

    await sql(migrationSQL);

    console.log("✅ Competency system migration completed successfully!");

    // Verify tables were created
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%competenc%' OR table_name LIKE '%evaluation%' OR table_name LIKE '%peer_feedback%' OR table_name LIKE '%development_plan%'
      ORDER BY table_name;
    `;

    console.log("\n📊 Created tables:");
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });

  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
}

main();
