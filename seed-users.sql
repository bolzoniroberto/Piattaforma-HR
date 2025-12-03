-- Create demo users for local development
INSERT INTO users (id, email, first_name, last_name, role, is_active, created_at, updated_at)
VALUES
  ('admin-001', 'admin@example.com', 'Admin', 'User', 'admin', true, NOW(), NOW()),
  ('employee-001', 'employee@example.com', 'Mario', 'Rossi', 'employee', true, NOW(), NOW()),
  ('employee-002', 'employee2@example.com', 'Luigi', 'Verdi', 'employee', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
