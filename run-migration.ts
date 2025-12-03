import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const sql = fs.readFileSync('add-reporting-to-dictionary.sql', 'utf-8');
  await client.query(sql);

  console.log('Migration applied successfully');
  await client.end();
}

runMigration().catch(console.error);
