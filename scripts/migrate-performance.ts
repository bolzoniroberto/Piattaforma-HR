import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "mbo.sqlite");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = OFF");

const migrations = [
  // competency_models
  `CREATE TABLE IF NOT EXISTS competency_models (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    persona_type TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,

  // user_competency_model_assignments
  `CREATE TABLE IF NOT EXISTS user_competency_model_assignments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_model_id TEXT NOT NULL REFERENCES competency_models(id) ON DELETE CASCADE,
    assigned_at INTEGER DEFAULT (unixepoch()),
    assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    valid_from INTEGER NOT NULL DEFAULT (unixepoch()),
    valid_to INTEGER,
    is_current INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_user_model_current ON user_competency_model_assignments(user_id, competency_model_id, is_current)`,

  // competencies
  `CREATE TABLE IF NOT EXISTS competencies (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    model_id TEXT NOT NULL REFERENCES competency_models(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    is_transversal INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,

  // evaluation_cycles
  `CREATE TABLE IF NOT EXISTS evaluation_cycles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    self_assessment_start INTEGER,
    self_assessment_end INTEGER,
    peer_feedback_start INTEGER,
    peer_feedback_end INTEGER,
    manager_evaluation_start INTEGER,
    manager_evaluation_end INTEGER,
    calibration_start INTEGER,
    calibration_end INTEGER,
    interview_start INTEGER,
    interview_end INTEGER,
    feedback_delivery_start INTEGER,
    feedback_delivery_end INTEGER,
    enable_360_feedback INTEGER NOT NULL DEFAULT 0,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,

  // self_assessments
  `CREATE TABLE IF NOT EXISTS self_assessments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_id TEXT NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    year INTEGER NOT NULL DEFAULT 0,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    submitted_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_self_assessment ON self_assessments(cycle_id, user_id, competency_id)`,

  // overall_self_assessments
  `CREATE TABLE IF NOT EXISTS overall_self_assessments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_rating INTEGER NOT NULL,
    overall_comment TEXT NOT NULL DEFAULT '',
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    submitted_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_overall_self_assessment ON overall_self_assessments(cycle_id, user_id)`,

  // peer_feedback_requests
  `CREATE TABLE IF NOT EXISTS peer_feedback_requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
    requestor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    peer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at INTEGER DEFAULT (unixepoch()),
    completed_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_peer_request ON peer_feedback_requests(cycle_id, requestor_user_id, peer_user_id)`,

  // peer_feedbacks
  `CREATE TABLE IF NOT EXISTS peer_feedbacks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    request_id TEXT NOT NULL REFERENCES peer_feedback_requests(id) ON DELETE CASCADE,
    cycle_id TEXT NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
    requestor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    peer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_id TEXT NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    year INTEGER NOT NULL DEFAULT 0,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    is_anonymous INTEGER NOT NULL DEFAULT 1,
    submitted_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_peer_feedback ON peer_feedbacks(request_id, competency_id)`,

  // manager_evaluations
  `CREATE TABLE IF NOT EXISTS manager_evaluations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
    employee_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manager_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_id TEXT NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    year INTEGER NOT NULL DEFAULT 0,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    submitted_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_manager_evaluation ON manager_evaluations(cycle_id, employee_user_id, competency_id)`,

  // development_plans
  `CREATE TABLE IF NOT EXISTS development_plans (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
    employee_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manager_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competencies_to_develop TEXT,
    development_goals TEXT NOT NULL DEFAULT '',
    action_items TEXT,
    manager_notes TEXT,
    employee_notes TEXT,
    feedback_session_date INTEGER,
    review_date INTEGER,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_development_plan ON development_plans(cycle_id, employee_user_id)`,

  // evaluation_notifications
  `CREATE TABLE IF NOT EXISTS evaluation_notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    phase TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    sent_at INTEGER DEFAULT (unixepoch()),
    read_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch())
  )`,

  // custom_field_definitions
  `CREATE TABLE IF NOT EXISTS custom_field_definitions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text',
    is_required INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    options TEXT,
    placeholder TEXT,
    help_text TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,

  // custom_field_values
  `CREATE TABLE IF NOT EXISTS custom_field_values (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    field_definition_id TEXT NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL DEFAULT 'user',
    entity_id TEXT NOT NULL,
    value TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_custom_field_value ON custom_field_values(field_definition_id, entity_type, entity_id)`,

  // evaluation_calibrations (NEW)
  `CREATE TABLE IF NOT EXISTS evaluation_calibrations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
    employee_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competency_id TEXT NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    original_rating INTEGER NOT NULL,
    calibrated_rating INTEGER NOT NULL,
    calibrated_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    year INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_calibration ON evaluation_calibrations(cycle_id, employee_user_id, competency_id)`,

  // evaluation_interviews (NEW)
  `CREATE TABLE IF NOT EXISTS evaluation_interviews (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
    employee_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manager_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL DEFAULT 0,
    scheduled_at INTEGER,
    completed_at INTEGER,
    outcome TEXT,
    manager_signed_at INTEGER,
    employee_signed_at INTEGER,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_interview ON evaluation_interviews(cycle_id, employee_user_id)`,

  // evaluation_sheets (NEW)
  `CREATE TABLE IF NOT EXISTS evaluation_sheets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cycle_id TEXT NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    current_phase INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'open',
    mbo_score REAL,
    performance_score REAL,
    composite_score REAL,
    opened_at INTEGER DEFAULT (unixepoch()),
    closed_at INTEGER,
    closed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_eval_sheet ON evaluation_sheets(cycle_id, user_id)`,

  // data migration: individual_contributor -> expert
  `UPDATE competency_models SET persona_type = 'expert' WHERE persona_type = 'individual_contributor'`,

  // seed default app settings for composite weights
  `INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('mbo_weight', '60', unixepoch())`,
  `INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('performance_weight', '40', unixepoch())`,
];

console.log("Running performance module migration...\n");

let ok = 0;
let skip = 0;
for (const sql of migrations) {
  try {
    sqlite.prepare(sql).run();
    ok++;
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      skip++;
    } else {
      console.error(`FAILED: ${sql.slice(0, 80)}`);
      console.error(e.message);
    }
  }
}

sqlite.pragma("foreign_keys = ON");
console.log(`Migration complete: ${ok} statements executed, ${skip} skipped (already exist)`);
