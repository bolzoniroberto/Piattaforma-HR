#!/usr/bin/env tsx
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function runMigration(filePath: string, sql: any) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Running migration: ${fileName}`);

  try {
    const migrationSQL = fs.readFileSync(filePath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('COMMENT ON')) {
        // Skip comments for now
        continue;
      }
      await sql(statement);
    }

    console.log(`✅ ${fileName} completed successfully`);
  } catch (error) {
    console.error(`❌ Error in ${fileName}:`, error);
    throw error;
  }
}

async function main() {
  const sql = neon(DATABASE_URL);

  console.log('🚀 Starting database migrations...\n');

  const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

  // Run migrations in order
  const migrations = [
    '001_normalize_users.sql',
    '002_create_views.sql',
    '003_migrate_data.sql',
  ];

  for (const migration of migrations) {
    const migrationPath = path.join(migrationsDir, migration);

    if (!fs.existsSync(migrationPath)) {
      console.log(`⚠️  Skipping ${migration} - file not found`);
      continue;
    }

    await runMigration(migrationPath, sql);
  }

  console.log('\n🎉 All migrations completed successfully!');

  // Verify tables
  console.log('\n📊 Verifying table counts:');
  const counts = await sql`
    SELECT 'persona' as table_name, COUNT(*) as count FROM persona
    UNION ALL
    SELECT 'contatti', COUNT(*) FROM contatti
    UNION ALL
    SELECT 'organizzazione', COUNT(*) FROM organizzazione
    UNION ALL
    SELECT 'contratti', COUNT(*) FROM contratti
    UNION ALL
    SELECT 'compensation', COUNT(*) FROM compensation
    UNION ALL
    SELECT 'ruoli', COUNT(*) FROM ruoli
    UNION ALL
    SELECT 'users (original)', COUNT(*) FROM users
    ORDER BY table_name;
  `;

  console.table(counts);

  // Test view
  console.log('\n🔍 Testing user_complete view (first 3 records):');
  const viewTest = await sql`SELECT * FROM user_complete LIMIT 3`;
  console.table(viewTest.map(u => ({
    email: u.email,
    name: `${u.first_name} ${u.last_name}`,
    cf: u.codice_fiscale,
    cdc: u.cdc,
    role: u.role,
    ral: u.ral,
    active: u.is_active,
  })));
}

main().catch((error) => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
