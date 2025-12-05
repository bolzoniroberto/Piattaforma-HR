import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const sql = fs.readFileSync('db/migrations/004_add_contact_fields_to_users.sql', 'utf-8');
    await client.query(sql);
    console.log('✅ Migration 004 applied successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);
