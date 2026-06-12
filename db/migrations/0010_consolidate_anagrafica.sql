-- Consolidamento anagrafica: colonne ricche su users (ex schema normalizzato).
-- Idempotente via try/catch del runner (ALTER colonna duplicata -> errore ingoiato).
ALTER TABLE users ADD COLUMN area TEXT;
ALTER TABLE users ADD COLUMN sotto_area TEXT;
ALTER TABLE users ADD COLUMN unita_organizzativa TEXT;
ALTER TABLE users ADD COLUMN struttura_l1 TEXT;
ALTER TABLE users ADD COLUMN struttura_l2 TEXT;
ALTER TABLE users ADD COLUMN struttura_l3 TEXT;
ALTER TABLE users ADD COLUMN sede TEXT;
ALTER TABLE users ADD COLUMN sede_comune TEXT;
ALTER TABLE users ADD COLUMN sede_provincia TEXT;
ALTER TABLE users ADD COLUMN data_assunzione INTEGER;
ALTER TABLE users ADD COLUMN qualifica TEXT;
ALTER TABLE users ADD COLUMN livello TEXT;
ALTER TABLE users ADD COLUMN job_title TEXT;
ALTER TABLE users ADD COLUMN ccnl TEXT;
