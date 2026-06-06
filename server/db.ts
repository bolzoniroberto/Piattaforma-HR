import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'mbo.sqlite');
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');

// Enforce foreign keys
sqlite.pragma('foreign_keys = ON');

// Busy timeout (milliseconds to wait if database is locked)
sqlite.pragma('busy_timeout = 5000');

export const db = drizzle({ client: sqlite, schema });
export { sqlite };

export function initializeDatabase() {
  try {
    const tableCount = sqlite
      .prepare(
        "SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name NOT IN ('sqlite_sequence')"
      )
      .get() as { cnt: number };

    if (tableCount.cnt === 0) {
      console.log('Database not initialized, running migrations...');

      const migrationPath = path.join(process.cwd(), 'db', 'migrations', '001_initial_schema.sql');

      try {
        const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
        sqlite.exec(migrationSql);
        console.log('Database initialized successfully');
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.warn('Migration file not found, database will be created by Drizzle ORM');
        } else {
          throw err;
        }
      }
    } else {
      console.log(`Database found with ${tableCount.cnt} tables`);
    }

    // Incremental migrations: apply new tables if missing
    const incrementalMigrations = [
      path.join(process.cwd(), 'db', 'migrations', '0003_doc_generation.sql'),
      path.join(process.cwd(), 'db', 'migrations', '0004_doc_signers.sql'),
      path.join(process.cwd(), 'db', 'migrations', '0005_doc_template_font.sql'),
      path.join(process.cwd(), 'db', 'migrations', '0006_doc_template_category.sql'),
    ];
    for (const migPath of incrementalMigrations) {
      if (fs.existsSync(migPath)) {
        try {
          sqlite.exec(fs.readFileSync(migPath, 'utf-8'));
        } catch {}
      }
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}
