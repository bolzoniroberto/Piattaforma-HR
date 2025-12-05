-- Migration: Add contact fields to users table
-- Description: Adds telefono and indirizzo fields to users table for profile management
-- Date: 2025-12-05

ALTER TABLE users
ADD COLUMN IF NOT EXISTS telefono VARCHAR,
ADD COLUMN IF NOT EXISTS indirizzo TEXT,
ADD COLUMN IF NOT EXISTS cap VARCHAR(10),
ADD COLUMN IF NOT EXISTS citta VARCHAR;

-- Add indexes for phone number searching if needed
CREATE INDEX IF NOT EXISTS idx_users_telefono ON users(telefono);
