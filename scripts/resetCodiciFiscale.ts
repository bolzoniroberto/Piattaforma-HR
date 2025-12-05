#!/usr/bin/env tsx
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL!);

async function main() {
  console.log('🔄 Resetting codice_fiscale in users table...\n');

  // Reset all cod ice_fiscale to NULL first
  await sql`UPDATE users SET codice_fiscale = NULL`;

  console.log('✅ Reset complete\n');

  // Now set them to MD5 hash (16 chars)
  await sql`
    UPDATE users
    SET codice_fiscale = UPPER(SUBSTRING(MD5(id), 1, 16))
  `;

  console.log('✅ Generated new codice_fiscale\n');

  // Verify
  const users = await sql`
    SELECT id, email, codice_fiscale, LENGTH(codice_fiscale) as cf_length
    FROM users
    LIMIT 5
  `;

  console.table(users);
}

main();
