-- Add notes field to objectives_dictionary (from Excel 'Note' column)
ALTER TABLE objectives_dictionary ADD COLUMN notes TEXT;

-- Add premio_max to objective_assignments (from Excel 'Premio Max (€)' per objective)
ALTER TABLE objective_assignments ADD COLUMN premio_max REAL;
