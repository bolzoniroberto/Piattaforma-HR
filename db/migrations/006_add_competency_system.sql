-- Migration 006: Add Competency & Performance Management System
-- Description: Add tables for competency models, evaluations, 360° feedback, and development plans

-- 1. Competency Models - Templates for different personas
CREATE TABLE IF NOT EXISTS competency_models (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  persona_type VARCHAR NOT NULL CHECK (persona_type IN ('executive', 'manager', 'professional', 'individual_contributor')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Competencies - Individual competency definitions
CREATE TABLE IF NOT EXISTS competencies (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR NOT NULL REFERENCES competency_models(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  is_transversal BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Evaluation Cycles - Annual evaluation periods with phase dates
CREATE TABLE IF NOT EXISTS evaluation_cycles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  year INTEGER NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),

  -- Phase dates
  self_assessment_start TIMESTAMP,
  self_assessment_end TIMESTAMP,
  peer_feedback_start TIMESTAMP,
  peer_feedback_end TIMESTAMP,
  manager_evaluation_start TIMESTAMP,
  manager_evaluation_end TIMESTAMP,
  feedback_delivery_start TIMESTAMP,
  feedback_delivery_end TIMESTAMP,

  -- Configuration
  enable_360_feedback BOOLEAN DEFAULT false,

  -- Metadata
  created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Self Assessments - Employee self-evaluations
CREATE TABLE IF NOT EXISTS self_assessments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id VARCHAR NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competency_id VARCHAR NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(cycle_id, user_id, competency_id)
);

-- 5. Peer Feedback Requests - 360° feedback requests
CREATE TABLE IF NOT EXISTS peer_feedback_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id VARCHAR NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  requestor_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  peer_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined')),
  requested_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(cycle_id, requestor_user_id, peer_user_id)
);

-- 6. Peer Feedbacks - Anonymous 360° feedback
CREATE TABLE IF NOT EXISTS peer_feedbacks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR NOT NULL REFERENCES peer_feedback_requests(id) ON DELETE CASCADE,
  cycle_id VARCHAR NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  requestor_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  peer_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competency_id VARCHAR NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(request_id, competency_id)
);

-- 7. Manager Evaluations - Manager's final evaluations
CREATE TABLE IF NOT EXISTS manager_evaluations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id VARCHAR NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  employee_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competency_id VARCHAR NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(cycle_id, employee_user_id, competency_id)
);

-- 8. Development Plans - Collaborative development plans
CREATE TABLE IF NOT EXISTS development_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id VARCHAR NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  employee_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Competencies to develop (JSON array of competency IDs)
  competencies_to_develop JSONB,

  -- Development goals
  development_goals TEXT NOT NULL,

  -- Action items (JSON array of objects with action, deadline, status)
  action_items JSONB,

  -- Notes
  manager_notes TEXT,
  employee_notes TEXT,

  -- Timeline
  feedback_session_date TIMESTAMP,
  review_date TIMESTAMP,

  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'agreed', 'in_progress', 'completed')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(cycle_id, employee_user_id)
);

-- 9. Evaluation Notifications - Automated notification system
CREATE TABLE IF NOT EXISTS evaluation_notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id VARCHAR NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR NOT NULL,
  phase VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_competencies_model_id ON competencies(model_id);
CREATE INDEX IF NOT EXISTS idx_competencies_is_transversal ON competencies(is_transversal);
CREATE INDEX IF NOT EXISTS idx_evaluation_cycles_status ON evaluation_cycles(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_cycles_year ON evaluation_cycles(year);
CREATE INDEX IF NOT EXISTS idx_self_assessments_cycle_user ON self_assessments(cycle_id, user_id);
CREATE INDEX IF NOT EXISTS idx_self_assessments_competency ON self_assessments(competency_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedback_requests_cycle ON peer_feedback_requests(cycle_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedback_requests_requestor ON peer_feedback_requests(requestor_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedback_requests_peer ON peer_feedback_requests(peer_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedbacks_cycle ON peer_feedbacks(cycle_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedbacks_requestor ON peer_feedbacks(requestor_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedbacks_competency ON peer_feedbacks(competency_id);
CREATE INDEX IF NOT EXISTS idx_manager_evaluations_cycle ON manager_evaluations(cycle_id);
CREATE INDEX IF NOT EXISTS idx_manager_evaluations_employee ON manager_evaluations(employee_user_id);
CREATE INDEX IF NOT EXISTS idx_manager_evaluations_manager ON manager_evaluations(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_manager_evaluations_competency ON manager_evaluations(competency_id);
CREATE INDEX IF NOT EXISTS idx_development_plans_cycle ON development_plans(cycle_id);
CREATE INDEX IF NOT EXISTS idx_development_plans_employee ON development_plans(employee_user_id);
CREATE INDEX IF NOT EXISTS idx_development_plans_manager ON development_plans(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_notifications_user ON evaluation_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_notifications_cycle ON evaluation_notifications(cycle_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_notifications_is_read ON evaluation_notifications(is_read);

-- Add persona_type column to users table if it doesn't exist
-- This allows matching users to competency models
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'persona_type'
  ) THEN
    ALTER TABLE users ADD COLUMN persona_type VARCHAR CHECK (persona_type IN ('executive', 'manager', 'professional', 'individual_contributor'));
  END IF;
END $$;
