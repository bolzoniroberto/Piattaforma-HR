import { Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verifyMigration() {
  const client = await pool.connect();

  try {
    console.log('\n🔍 Verifying migration...\n');

    // Check new tables
    const newTables = [
      'sedi',
      'ccnl',
      'livelli_contrattuali',
      'categorie_protette',
      'configurazioni_orario',
      'causali_assunzione',
      'smart_working_storico',
      'livelli_contrattuali_storico'
    ];

    console.log('📋 Checking new tables:');
    for (const table of newTables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )`,
        [table]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✓' : '✗'} ${table}`);
    }

    // Check new columns in persona
    console.log('\n📋 Checking persona extensions:');
    const personaColumns = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'persona' AND column_name = 'matricola'`
    );
    console.log(`  ${personaColumns.rows.length > 0 ? '✓' : '✗'} matricola column`);

    // Check new columns in users
    console.log('\n📋 Checking users extensions:');
    const usersColumns = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'users' AND column_name IN ('codice_fiscale', 'matricola')`
    );
    console.log(`  ${usersColumns.rows.length === 2 ? '✓' : '✗'} codice_fiscale and matricola columns (${usersColumns.rows.length}/2)`);

    // Check new columns in contratti
    console.log('\n📋 Checking contratti extensions:');
    const contrattiNewCols = [
      'matricola',
      'data_assunzione_gruppo',
      'causale_assunzione_id',
      'ccnl_id',
      'livello_contrattuale_id',
      'categoria_protetta_id',
      'descrizione_part_time',
      'azienda_provenienza'
    ];
    const contrattiColumns = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'contratti' AND column_name = ANY($1)`,
      [contrattiNewCols]
    );
    console.log(`  ${contrattiColumns.rows.length === contrattiNewCols.length ? '✓' : '✗'} new columns (${contrattiColumns.rows.length}/${contrattiNewCols.length})`);

    // Check new columns in organizzazione
    console.log('\n📋 Checking organizzazione extensions:');
    const orgNewCols = [
      'sede_id',
      'data_decorrenza_sede',
      'sindacato',
      'configurazione_orario_id',
      'configurazione_timbra_firma_id'
    ];
    const orgColumns = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'organizzazione' AND column_name = ANY($1)`,
      [orgNewCols]
    );
    console.log(`  ${orgColumns.rows.length === orgNewCols.length ? '✓' : '✗'} new columns (${orgColumns.rows.length}/${orgNewCols.length})`);

    // Check indexes
    console.log('\n📋 Checking new indexes:');
    const indexes = await client.query(
      `SELECT indexname FROM pg_indexes
       WHERE schemaname = 'public'
       AND indexname LIKE 'idx_%'
       AND indexname IN (
         'idx_persona_matricola',
         'idx_users_codice_fiscale',
         'idx_users_matricola',
         'idx_contratti_matricola',
         'idx_contratti_ccnl',
         'idx_contratti_livello',
         'idx_contratti_ccnl_livello',
         'idx_contratti_categoria_protetta',
         'idx_organizzazione_sede',
         'idx_sw_storico_cf',
         'idx_sw_storico_current',
         'idx_livelli_storico_contratto',
         'idx_livelli_storico_current',
         'idx_ruoli_hierarchy',
         'unique_ccnl_livello'
       )`
    );
    console.log(`  ✓ ${indexes.rows.length} indexes created`);
    indexes.rows.forEach(row => console.log(`    - ${row.indexname}`));

    console.log('\n✅ Migration verification complete!\n');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyMigration();
