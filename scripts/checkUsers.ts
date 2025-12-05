#!/usr/bin/env tsx
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL!);

async function main() {
  console.log('Checking users table:\n');

  const users = await sql`
    SELECT id, email, first_name, last_name, codice_fiscale
    FROM users
    LIMIT 5
  `;

  console.table(users);

  const cfCount = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(codice_fiscale) as with_cf,
      COUNT(*) - COUNT(codice_fiscale) as without_cf
    FROM users
  `;

  console.log('\nCodece Fiscale Status:');
  console.table(cfCount);
}

main();
