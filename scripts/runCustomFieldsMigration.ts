import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('📄 Running custom fields migration...');

    const migrationPath = path.join(process.cwd(), 'db/migrations/005_create_custom_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

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

    console.log('✅ Custom fields migration completed successfully!');

    // Verify
    const fields = await sql`SELECT id, field_name, field_label, is_active FROM custom_field_definitions ORDER BY display_order`;
    console.log('\n📊 Custom fields in database:');
    console.table(fields);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
