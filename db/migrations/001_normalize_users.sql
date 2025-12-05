-- Migration: Normalize Users Database Structure
-- Description: Creates normalized tables for persona, contatti, organizzazione, contratti, compensation, ruoli
-- Date: 2025-12-05

-- ==============================================
-- 1. PERSONA TABLE (Dati Anagrafici Base)
-- ==============================================
CREATE TABLE IF NOT EXISTS persona (
  codice_fiscale VARCHAR(16) PRIMARY KEY,
  cognome VARCHAR NOT NULL,
  nome VARCHAR NOT NULL,
  data_nascita DATE,
  sesso VARCHAR(1) CHECK (sesso IN ('M', 'F', 'A')),
  cittadinanza VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for persona
CREATE INDEX IF NOT EXISTS idx_persona_cognome_nome ON persona(cognome, nome);

-- ==============================================
-- 2. CONTATTI TABLE (Informazioni di Contatto)
-- ==============================================
CREATE TABLE IF NOT EXISTS contatti (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  codice_fiscale VARCHAR(16) NOT NULL UNIQUE REFERENCES persona(codice_fiscale) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  telefono VARCHAR,
  indirizzo TEXT,
  cap VARCHAR(10),
  citta VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for contatti
CREATE UNIQUE INDEX IF NOT EXISTS idx_contatti_email ON contatti(email);
CREATE INDEX IF NOT EXISTS idx_contatti_cf ON contatti(codice_fiscale);

-- ==============================================
-- 3. ORGANIZZAZIONE TABLE (Struttura Aziendale)
-- ==============================================
CREATE TABLE IF NOT EXISTS organizzazione (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  codice_fiscale VARCHAR(16) NOT NULL UNIQUE REFERENCES persona(codice_fiscale) ON DELETE CASCADE,
  codice_azienda VARCHAR,
  azienda VARCHAR,

  -- Gerarchia strutturale (3 livelli)
  codice_struttura_l1 VARCHAR,
  descrizione_struttura_l1 VARCHAR,
  codice_struttura_l2 VARCHAR,
  descrizione_struttura_l2 VARCHAR,
  codice_struttura_l3 VARCHAR,
  descrizione_struttura_l3 VARCHAR,

  -- Centro di Costo
  codice_cdc VARCHAR,
  descrizione_cdc VARCHAR,

  -- Suddivisioni organizzative
  area VARCHAR,
  sotto_area VARCHAR,
  unita_organizzativa VARCHAR,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for organizzazione
CREATE INDEX IF NOT EXISTS idx_org_cf ON organizzazione(codice_fiscale);
CREATE INDEX IF NOT EXISTS idx_org_cdc ON organizzazione(codice_cdc);
CREATE INDEX IF NOT EXISTS idx_org_area ON organizzazione(area, sotto_area);

-- ==============================================
-- 4. CONTRATTI TABLE (Informazioni Contrattuali)
-- ==============================================
CREATE TABLE IF NOT EXISTS contratti (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  codice_fiscale VARCHAR(16) NOT NULL REFERENCES persona(codice_fiscale) ON DELETE CASCADE,

  -- Date contrattuali
  data_assunzione DATE,
  data_fine_rapporto DATE,
  data_cessazione DATE,

  -- Tipologia contratto
  codice_contratto VARCHAR,
  descrizione_contratto VARCHAR,
  tipologia_contratto_termine VARCHAR,

  -- Classificazione
  qualifica VARCHAR,
  livello VARCHAR,
  job_title VARCHAR,

  -- Part-time
  part_time_codice VARCHAR,
  part_time_percentuale INTEGER CHECK (part_time_percentuale >= 0 AND part_time_percentuale <= 100),
  part_time_data_inizio DATE,
  part_time_data_fine DATE,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for contratti
CREATE INDEX IF NOT EXISTS idx_contratti_cf ON contratti(codice_fiscale);
CREATE INDEX IF NOT EXISTS idx_contratti_attivi ON contratti(is_active, data_fine_rapporto);
CREATE INDEX IF NOT EXISTS idx_contratti_job_title ON contratti(job_title);

-- ==============================================
-- 5. COMPENSATION TABLE (Retribuzione e MBO)
-- ==============================================
CREATE TABLE IF NOT EXISTS compensation (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  codice_fiscale VARCHAR(16) NOT NULL REFERENCES persona(codice_fiscale) ON DELETE CASCADE,

  -- Retribuzione
  ral NUMERIC(12, 2),
  valuta VARCHAR(3) DEFAULT 'EUR',

  -- MBO
  mbo_percentuale INTEGER CHECK (mbo_percentuale % 5 = 0),
  mbo_target_euro NUMERIC(12, 2),

  -- Periodo di validità
  valido_da DATE NOT NULL,
  valido_a DATE,

  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for compensation
CREATE INDEX IF NOT EXISTS idx_compensation_cf ON compensation(codice_fiscale);
CREATE INDEX IF NOT EXISTS idx_compensation_current ON compensation(is_current, codice_fiscale);
CREATE INDEX IF NOT EXISTS idx_compensation_validita ON compensation(valido_da, valido_a);

-- ==============================================
-- 6. RUOLI TABLE (Ruoli e Responsabilità)
-- ==============================================
CREATE TABLE IF NOT EXISTS ruoli (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  codice_fiscale VARCHAR(16) NOT NULL UNIQUE REFERENCES persona(codice_fiscale) ON DELETE CASCADE,

  -- Gerarchia
  primo_responsabile_cf VARCHAR(16) REFERENCES persona(codice_fiscale) ON DELETE SET NULL,
  responsabile_diretto_cf VARCHAR(16) REFERENCES persona(codice_fiscale) ON DELETE SET NULL,
  reports_to_cf VARCHAR(16) REFERENCES persona(codice_fiscale) ON DELETE SET NULL,

  -- Ruoli speciali
  is_tns BOOLEAN DEFAULT FALSE,
  is_sgsl BOOLEAN DEFAULT FALSE,
  is_privacy BOOLEAN DEFAULT FALSE,

  -- Sistema
  role VARCHAR NOT NULL DEFAULT 'employee',
  profile_image_url VARCHAR,
  mbo_regulation_accepted_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for ruoli
CREATE INDEX IF NOT EXISTS idx_ruoli_cf ON ruoli(codice_fiscale);
CREATE INDEX IF NOT EXISTS idx_ruoli_responsabile ON ruoli(responsabile_diretto_cf);
CREATE INDEX IF NOT EXISTS idx_ruoli_role ON ruoli(role);

-- ==============================================
-- 7. UPDATE USERS TABLE (Autenticazione - Mapping)
-- Mantiene compatibilità con auth esistente
-- ==============================================
-- Note: Not dropping existing users table, will be updated in migration script

COMMENT ON TABLE persona IS 'Dati anagrafici base (Primary Key: codice_fiscale)';
COMMENT ON TABLE contatti IS 'Informazioni di contatto (email usata per autenticazione)';
COMMENT ON TABLE organizzazione IS 'Struttura aziendale con 3 livelli e CDC';
COMMENT ON TABLE contratti IS 'Informazioni contrattuali e job title';
COMMENT ON TABLE compensation IS 'Retribuzione e MBO con storico temporale';
COMMENT ON TABLE ruoli IS 'Ruoli, responsabilità e gerarchia aziendale';
