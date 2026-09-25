-- Credenziali password separate dalla tabella users per evitare leak dell'hash
-- nelle risposte API (gli endpoint ritornano spesso l'oggetto user completo).
CREATE TABLE IF NOT EXISTS user_credentials (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch())
);
