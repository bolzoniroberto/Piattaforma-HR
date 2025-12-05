-- Migration: Create Views for Backward Compatibility
-- Description: Creates user_complete view that joins all normalized tables
-- Date: 2025-12-05

-- ==============================================
-- VIEW: user_complete
-- Unisce tutti i dati per query semplificate
-- ==============================================
CREATE OR REPLACE VIEW user_complete AS
SELECT
  u.id,
  u.email,
  p.codice_fiscale,
  p.nome AS first_name,
  p.cognome AS last_name,
  p.data_nascita,
  p.sesso,
  p.cittadinanza,
  c.telefono,
  c.indirizzo,
  c.cap,
  c.citta,
  o.codice_azienda,
  o.azienda,
  o.codice_struttura_l1,
  o.descrizione_struttura_l1,
  o.codice_struttura_l2,
  o.descrizione_struttura_l2,
  o.codice_struttura_l3,
  o.descrizione_struttura_l3,
  o.codice_cdc AS cdc,
  o.descrizione_cdc,
  o.area,
  o.sotto_area AS department, -- Mapping legacy field
  o.unita_organizzativa,
  r.role,
  r.responsabile_diretto_cf AS manager_id,
  r.primo_responsabile_cf,
  r.reports_to_cf,
  r.is_tns,
  r.is_sgsl,
  r.is_privacy,
  r.profile_image_url,
  r.mbo_regulation_accepted_at,
  comp.ral,
  comp.valuta,
  comp.mbo_percentuale AS mbo_percentage,
  comp.mbo_target_euro,
  comp.valido_da AS compensation_valido_da,
  comp.valido_a AS compensation_valido_a,
  contr.data_assunzione,
  contr.data_fine_rapporto,
  contr.data_cessazione,
  contr.codice_contratto,
  contr.descrizione_contratto,
  contr.tipologia_contratto_termine,
  contr.job_title,
  contr.qualifica,
  contr.livello,
  contr.part_time_codice,
  contr.part_time_percentuale,
  contr.part_time_data_inizio,
  contr.part_time_data_fine,
  contr.is_active,
  u.created_at,
  u.updated_at,
  -- Calculated field: età
  CASE
    WHEN p.data_nascita IS NOT NULL
    THEN EXTRACT(YEAR FROM AGE(p.data_nascita))::INTEGER
    ELSE NULL
  END AS eta
FROM users u
INNER JOIN persona p ON u.codice_fiscale = p.codice_fiscale
INNER JOIN contatti c ON p.codice_fiscale = c.codice_fiscale
LEFT JOIN organizzazione o ON p.codice_fiscale = o.codice_fiscale
LEFT JOIN ruoli r ON p.codice_fiscale = r.codice_fiscale
LEFT JOIN LATERAL (
  SELECT * FROM compensation
  WHERE codice_fiscale = p.codice_fiscale AND is_current = TRUE
  ORDER BY valido_da DESC
  LIMIT 1
) comp ON TRUE
LEFT JOIN LATERAL (
  SELECT * FROM contratti
  WHERE codice_fiscale = p.codice_fiscale AND is_active = TRUE
  ORDER BY data_assunzione DESC
  LIMIT 1
) contr ON TRUE;

COMMENT ON VIEW user_complete IS 'Vista completa dati utente - unisce tutte le tabelle normalizzate';
