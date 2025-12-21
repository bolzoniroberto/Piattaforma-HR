import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration(migrationFile: string) {
  console.log(`Running migration: ${migrationFile}`);

  const migrationPath = join(__dirname, '..', 'migrations', migrationFile);
  const sql = readFileSync(migrationPath, 'utf-8');

  // Split by statement breakpoint and clean up
  const statements = sql
    .split('--> statement-breakpoint')
    .map(s => {
      // Remove comment lines but keep SQL statements
      return s
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          return trimmed && !trimmed.startsWith('--');
        })
        .join('\n')
        .trim();
    })
    .filter(s => s.length > 0);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 80)}...`);
        await client.query(statement);
      }
    }

    await client.query('COMMIT');
    console.log('✓ Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: tsx scripts/runMigration.ts <migration-file>');
  console.error('Example: tsx scripts/runMigration.ts 0004_add_anagrafica_complete.sql');
  process.exit(1);
}

runMigration(migrationFile);
