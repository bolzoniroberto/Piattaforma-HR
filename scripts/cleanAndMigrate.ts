#!/usr/bin/env tsx
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL!);

async function main() {
  console.log('🧹 Cleaning normalized tables...\n');

  // Truncate tables in reverse dependency order
  await sql`TRUNCATE TABLE compensation CASCADE`;
  await sql`TRUNCATE TABLE contratti CASCADE`;
  await sql`TRUNCATE TABLE ruoli CASCADE`;
  await sql`TRUNCATE TABLE organizzazione CASCADE`;
  await sql`TRUNCATE TABLE contatti CASCADE`;
  await sql`TRUNCATE TABLE persona CASCADE`;

  console.log('✅ Tables cleaned\n');

  console.log('🚀 Running data migration...\n');

  const migrationPath = path.join(__dirname, '..', 'db', 'migrations', '003_migrate_data.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Execute migration statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s =>
      s.length > 0 &&
      !s.startsWith('--') &&
      !s.includes('COMMENT ON') &&
      !s.includes('SELECT') // Skip verification queries
    );

  for (const statement of statements) {
    try {
      await sql(statement);
    } catch (error: any) {
      console.error('Error executing statement:', statement.substring(0, 100));
      console.error(error.message);
    }
  }

  console.log('✅ Migration completed\n');

  // Verify
  console.log('📊 Table counts:');
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
  console.log('\n🔍 Sample from user_complete view:');
  try {
    const viewTest = await sql`SELECT * FROM user_complete LIMIT 3`;
    console.table(viewTest.map((u: any) => ({
      email: u.email,
      name: `${u.first_name} ${u.last_name}`,
      cf: u.codice_fiscale,
      cdc: u.cdc,
      department: u.department,
      role: u.role,
      active: u.is_active,
    })));
    console.log('\n✅ View working correctly!');
  } catch (error: any) {
    console.error('\n❌ View not found, creating it...');
    const viewPath = path.join(__dirname, '..', 'db', 'migrations', '002_create_views.sql');
    const viewSQL = fs.readFileSync(viewPath, 'utf-8');
    await sql(viewSQL);
    console.log('✅ View created');
  }
}

main();
