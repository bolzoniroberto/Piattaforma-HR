#!/usr/bin/env tsx
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL!);

async function main() {
  console.log('🚀 Starting direct data migration...\n');

  // Step 1: Ensure all users have codice_fiscale (max 16 chars)
  console.log('Step 1: Generating codice_fiscale for users...');
  await sql`
    UPDATE users
    SET codice_fiscale = UPPER(SUBSTRING(MD5(id), 1, 16))
    WHERE codice_fiscale IS NULL OR codice_fiscale = ''
  `;
  console.log('✅ Done\n');

  // Step 2: Insert into persona
  console.log('Step 2: Inserting into persona...');
  await sql`
    INSERT INTO persona (codice_fiscale, cognome, nome, data_nascita, sesso)
    SELECT
      codice_fiscale,
      COALESCE(last_name, 'NonDisponibile') AS cognome,
      COALESCE(first_name, 'NonDisponibile') AS nome,
      NULL AS data_nascita,
      NULL AS sesso
    FROM users
    WHERE codice_fiscale IS NOT NULL
    ON CONFLICT (codice_fiscale) DO NOTHING
  `;
  console.log('✅ Done\n');

  // Step 3: Insert into contatti
  console.log('Step 3: Inserting into contatti...');
  await sql`
    INSERT INTO contatti (codice_fiscale, email, telefono, indirizzo, cap, citta)
    SELECT
      codice_fiscale,
      email,
      NULL AS telefono,
      NULL AS indirizzo,
      NULL AS cap,
      NULL AS citta
    FROM users
    WHERE codice_fiscale IS NOT NULL AND email IS NOT NULL
    ON CONFLICT (codice_fiscale) DO NOTHING
  `;
  console.log('✅ Done\n');

  // Step 4: Insert into organizzazione
  console.log('Step 4: Inserting into organizzazione...');
  await sql`
    INSERT INTO organizzazione (
      codice_fiscale,
      codice_cdc,
      descrizione_cdc,
      area,
      sotto_area,
      unita_organizzativa
    )
    SELECT
      codice_fiscale,
      cdc AS codice_cdc,
      NULL AS descrizione_cdc,
      NULL AS area,
      department AS sotto_area,
      NULL AS unita_organizzativa
    FROM users
    WHERE codice_fiscale IS NOT NULL
    ON CONFLICT (codice_fiscale) DO NOTHING
  `;
  console.log('✅ Done\n');

  // Step 5: Insert into contratti
  console.log('Step 5: Inserting into contratti...');
  await sql`
    INSERT INTO contratti (
      codice_fiscale,
      is_active,
      data_assunzione,
      job_title,
      qualifica,
      livello
    )
    SELECT
      codice_fiscale,
      COALESCE(is_active, TRUE) AS is_active,
      NULL AS data_assunzione,
      NULL AS job_title,
      NULL AS qualifica,
      NULL AS livello
    FROM users
    WHERE codice_fiscale IS NOT NULL
  `;
  console.log('✅ Done\n');

  // Step 6: Insert into compensation (only for users with RAL or MBO)
  console.log('Step 6: Inserting into compensation...');
  await sql`
    INSERT INTO compensation (
      codice_fiscale,
      ral,
      mbo_percentuale,
      valido_da,
      is_current
    )
    SELECT
      codice_fiscale,
      ral,
      mbo_percentage AS mbo_percentuale,
      CURRENT_DATE AS valido_da,
      TRUE AS is_current
    FROM users
    WHERE codice_fiscale IS NOT NULL AND (ral IS NOT NULL OR mbo_percentage IS NOT NULL)
  `;
  console.log('✅ Done\n');

  // Step 7: Insert into ruoli
  console.log('Step 7: Inserting into ruoli...');
  await sql`
    INSERT INTO ruoli (
      codice_fiscale,
      responsabile_diretto_cf,
      role,
      profile_image_url,
      mbo_regulation_accepted_at
    )
    SELECT
      u.codice_fiscale,
      m.codice_fiscale AS responsabile_diretto_cf,
      u.role,
      u.profile_image_url,
      u.mbo_regulation_accepted_at
    FROM users u
    LEFT JOIN users m ON u.manager_id = m.id
    WHERE u.codice_fiscale IS NOT NULL
    ON CONFLICT (codice_fiscale) DO NOTHING
  `;
  console.log('✅ Done\n');

  // Verify
  console.log('📊 Final table counts:\n');
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
    SELECT 'users', COUNT(*) FROM users
    ORDER BY table_name
  `;

  console.table(counts);

  console.log('\n✅ Migration completed successfully!');
}

main();
