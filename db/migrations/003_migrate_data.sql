-- Migration: Migrate Existing Data to Normalized Tables
-- Description: Moves data from monolithic users table to normalized structure
-- Date: 2025-12-05
-- WARNING: This script assumes existing users table has dummy data that can be migrated

-- ==============================================
-- STEP 1: Insert into PERSONA
-- ==============================================
INSERT INTO persona (codice_fiscale, cognome, nome, data_nascita, sesso)
SELECT
  COALESCE(codice_fiscale, 'CF_' || id) AS codice_fiscale,
  COALESCE(last_name, 'NonDisponibile') AS cognome,
  COALESCE(first_name, 'NonDisponibile') AS nome,
  NULL AS data_nascita, -- Not present in current users table
  NULL AS sesso -- Not present in current users table
FROM users
WHERE codice_fiscale IS NOT NULL OR id IS NOT NULL
ON CONFLICT (codice_fiscale) DO NOTHING;

-- ==============================================
-- STEP 2: Insert into CONTATTI
-- ==============================================
INSERT INTO contatti (codice_fiscale, email, telefono, indirizzo, cap, citta)
SELECT
  COALESCE(codice_fiscale, 'CF_' || id) AS codice_fiscale,
  email,
  NULL AS telefono, -- Not present in current users table
  NULL AS indirizzo, -- Not present in current users table
  NULL AS cap, -- Not present in current users table
  NULL AS citta -- Not present in current users table
FROM users
WHERE email IS NOT NULL
ON CONFLICT (codice_fiscale) DO NOTHING;

-- ==============================================
-- STEP 3: Insert into ORGANIZZAZIONE
-- ==============================================
INSERT INTO organizzazione (
  codice_fiscale,
  codice_cdc,
  descrizione_cdc,
  area,
  sotto_area,
  unita_organizzativa
)
SELECT
  COALESCE(codice_fiscale, 'CF_' || id) AS codice_fiscale,
  cdc AS codice_cdc,
  NULL AS descrizione_cdc, -- Will be populated later
  NULL AS area, -- Not present in current users table
  department AS sotto_area, -- Mapping department to sotto_area
  NULL AS unita_organizzativa -- Not present in current users table
FROM users
ON CONFLICT (codice_fiscale) DO NOTHING;

-- ==============================================
-- STEP 4: Insert into CONTRATTI
-- ==============================================
INSERT INTO contratti (
  codice_fiscale,
  is_active,
  data_assunzione,
  job_title,
  qualifica,
  livello
)
SELECT
  COALESCE(codice_fiscale, 'CF_' || id) AS codice_fiscale,
  COALESCE(is_active, TRUE) AS is_active,
  NULL AS data_assunzione, -- Not present in current users table
  NULL AS job_title, -- Not present in current users table
  NULL AS qualifica, -- Not present in current users table
  NULL AS livello -- Not present in current users table
FROM users
ON CONFLICT DO NOTHING;

-- ==============================================
-- STEP 5: Insert into COMPENSATION
-- ==============================================
INSERT INTO compensation (
  codice_fiscale,
  ral,
  mbo_percentuale,
  valido_da,
  is_current
)
SELECT
  COALESCE(codice_fiscale, 'CF_' || id) AS codice_fiscale,
  ral,
  mbo_percentage AS mbo_percentuale,
  CURRENT_DATE AS valido_da,
  TRUE AS is_current
FROM users
WHERE ral IS NOT NULL OR mbo_percentage IS NOT NULL
ON CONFLICT DO NOTHING;

-- ==============================================
-- STEP 6: Insert into RUOLI
-- ==============================================
INSERT INTO ruoli (
  codice_fiscale,
  responsabile_diretto_cf,
  role,
  profile_image_url,
  mbo_regulation_accepted_at
)
SELECT
  COALESCE(u.codice_fiscale, 'CF_' || u.id) AS codice_fiscale,
  m.codice_fiscale AS responsabile_diretto_cf,
  u.role,
  u.profile_image_url,
  u.mbo_regulation_accepted_at
FROM users u
LEFT JOIN users m ON u.manager_id = m.id
ON CONFLICT (codice_fiscale) DO NOTHING;

-- ==============================================
-- STEP 7: Update USERS table (keep for auth)
-- ==============================================
-- First, ensure all users have a codice_fiscale
UPDATE users
SET codice_fiscale = 'CF_' || id
WHERE codice_fiscale IS NULL OR codice_fiscale = '';

-- Update first_name and last_name from persona if available
UPDATE users u
SET
  first_name = p.nome,
  last_name = p.cognome
FROM persona p
WHERE u.codice_fiscale = p.codice_fiscale;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================
-- Run these manually to verify migration success:

-- Count records in each table
-- SELECT 'persona' as table_name, COUNT(*) as count FROM persona
-- UNION ALL
-- SELECT 'contatti', COUNT(*) FROM contatti
-- UNION ALL
-- SELECT 'organizzazione', COUNT(*) FROM organizzazione
-- UNION ALL
-- SELECT 'contratti', COUNT(*) FROM contratti
-- UNION ALL
-- SELECT 'compensation', COUNT(*) FROM compensation
-- UNION ALL
-- SELECT 'ruoli', COUNT(*) FROM ruoli
-- UNION ALL
-- SELECT 'users (original)', COUNT(*) FROM users;

-- Test user_complete view
-- SELECT * FROM user_complete LIMIT 5;

-- Check for orphaned records
-- SELECT 'Orphaned contatti' as issue, COUNT(*)
-- FROM contatti c
-- LEFT JOIN persona p ON c.codice_fiscale = p.codice_fiscale
-- WHERE p.codice_fiscale IS NULL;

COMMENT ON TABLE persona IS 'Migration completed - verify counts match original users table';
