-- Add sesso (M/F) to users table as SSoT for gender (removes name heuristic in titolo calc)
ALTER TABLE users ADD COLUMN sesso TEXT CHECK(sesso IN ('M', 'F', NULL));

-- Add premio_source to document which SSoT was used for premio_max during last sync
-- 'manual' = users.premio set explicitly, 'calculated' = ral * mbo_percentage / 100
ALTER TABLE users ADD COLUMN premio_source TEXT CHECK(premio_source IN ('manual', 'calculated', NULL));
