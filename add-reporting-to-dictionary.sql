-- Add reporting fields to objectives_dictionary table
-- This allows reporting at the dictionary level instead of objective level

ALTER TABLE objectives_dictionary
ADD COLUMN IF NOT EXISTS actual_value NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS qualitative_result VARCHAR,
ADD COLUMN IF NOT EXISTS reported_at TIMESTAMP;

-- Add comments for clarity
COMMENT ON COLUMN objectives_dictionary.actual_value IS 'Actual value reported for numeric objectives';
COMMENT ON COLUMN objectives_dictionary.qualitative_result IS 'Result status: reached, partial, or not_reached';
COMMENT ON COLUMN objectives_dictionary.reported_at IS 'Timestamp when the objective was reported';
