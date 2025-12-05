#!/usr/bin/env tsx
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL!);

async function main() {
  console.log('🔍 Testing user_complete view...\n');

  try {
    const users = await sql`
      SELECT
        email,
        first_name,
        last_name,
        codice_fiscale,
        cdc,
        department,
        ral,
        mbo_percentage,
        role,
        is_active,
        eta
      FROM user_complete
      LIMIT 5
    `;

    console.table(users);

    console.log('\n✅ View is working correctly!');
    console.log(`\nTotal users in view: ${users.length}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

main();
