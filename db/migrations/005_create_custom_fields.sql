-- Migration: Create Custom Fields System
-- Description: Creates tables for dynamic custom fields that can be added by administrators
-- Date: 2025-12-12

-- Create custom_field_definitions table
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name VARCHAR NOT NULL,
  field_label VARCHAR NOT NULL,
  field_type VARCHAR NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'multiselect', 'boolean', 'email', 'phone', 'url', 'textarea')),
  category VARCHAR NOT NULL CHECK (category IN ('personal', 'contact', 'organizational', 'professional', 'custom')),
  section VARCHAR,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_searchable BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER DEFAULT 0,
  placeholder VARCHAR,
  help_text TEXT,
  validation_rules JSONB,
  options JSONB,
  default_value TEXT,
  created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create custom_field_values table
CREATE TABLE IF NOT EXISTS custom_field_values (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id VARCHAR NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_field_user UNIQUE (field_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_category ON custom_field_definitions(category);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_active ON custom_field_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_display_order ON custom_field_definitions(display_order);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_user_id ON custom_field_values(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field_id ON custom_field_values(field_id);

-- Insert some example custom fields
INSERT INTO custom_field_definitions (field_name, field_label, field_type, category, section, is_required, is_active, display_order, placeholder, help_text) VALUES
('taglia_maglietta', 'Taglia Maglietta', 'select', 'custom', 'Altro', false, true, 1, NULL, 'Taglia per eventi aziendali e gadget'),
('badge_number', 'Numero Badge', 'text', 'organizational', 'Informazioni Organizzative', false, true, 2, 'Es: A12345', 'Numero identificativo badge aziendale'),
('allergies', 'Allergie/Intolleranze', 'textarea', 'custom', 'Salute e Sicurezza', false, true, 3, 'Inserisci eventuali allergie', 'Informazioni per mensa aziendale ed eventi'),
('linkedin_profile', 'Profilo LinkedIn', 'url', 'contact', 'Contatti', false, true, 4, 'https://linkedin.com/in/...', 'Link al profilo LinkedIn'),
('patente_guida', 'Patente di Guida', 'select', 'personal', 'Documenti', false, true, 5, NULL, 'Tipo di patente posseduta'),
('auto_aziendale', 'Auto Aziendale', 'boolean', 'organizational', 'Benefit', false, true, 6, NULL, 'Indica se possiede auto aziendale'),
('data_scadenza_contratto', 'Scadenza Contratto', 'date', 'professional', 'Contratto', false, true, 7, NULL, 'Data di scadenza del contratto (se a termine)');

-- Update options for select fields
UPDATE custom_field_definitions
SET options = '[
  {"value": "xs", "label": "XS"},
  {"value": "s", "label": "S"},
  {"value": "m", "label": "M"},
  {"value": "l", "label": "L"},
  {"value": "xl", "label": "XL"},
  {"value": "xxl", "label": "XXL"}
]'::jsonb
WHERE field_name = 'taglia_maglietta';

UPDATE custom_field_definitions
SET options = '[
  {"value": "a", "label": "A - Moto"},
  {"value": "b", "label": "B - Auto"},
  {"value": "c", "label": "C - Autocarri"},
  {"value": "d", "label": "D - Autobus"},
  {"value": "e", "label": "E - Rimorchi"}
]'::jsonb
WHERE field_name = 'patente_guida';

-- Add comment to tables
COMMENT ON TABLE custom_field_definitions IS 'Defines custom fields that can be added dynamically by administrators';
COMMENT ON TABLE custom_field_values IS 'Stores values of custom fields for each user';
COMMENT ON COLUMN custom_field_definitions.field_type IS 'Data type: text, number, date, select, multiselect, boolean, email, phone, url, textarea';
COMMENT ON COLUMN custom_field_definitions.category IS 'Categorization: personal, contact, organizational, professional, custom';
COMMENT ON COLUMN custom_field_definitions.validation_rules IS 'JSON object with validation rules (min, max, pattern, etc.)';
COMMENT ON COLUMN custom_field_definitions.options IS 'JSON array of options for select/multiselect fields';
