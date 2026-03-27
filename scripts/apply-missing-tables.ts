import "dotenv/config";
import { sqlite } from "../server/db";
import fs from "fs";
import path from "path";

const sqlFile = path.resolve(process.argv[2] || "/tmp/missing_tables_fixed.sql");
const sql = fs.readFileSync(sqlFile, "utf-8");

// Use exec for the whole thing - better-sqlite3 supports multiple statements
try {
  sqlite.exec(sql);
  console.log("✅ All statements applied successfully");
} catch (e: any) {
  console.error("Error:", e.message);
  process.exit(1);
}

const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as {name: string}[];
console.log("Tables:", tables.map(t => t.name).join(", "));
process.exit(0);
