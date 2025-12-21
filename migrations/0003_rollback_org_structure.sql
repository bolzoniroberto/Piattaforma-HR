-- Rollback Migration: Remove All Organizational Structure Features
-- Created: 2025-12-18
-- Purpose: Drop all tables and indexes related to org structure added in commit 8e42863

-- Drop all organizational structure tables in reverse dependency order
-- This ensures foreign key constraints are respected

DROP TABLE IF EXISTS org_change_requests CASCADE;
DROP TABLE IF EXISTS change_request_types CASCADE;
DROP TABLE IF EXISTS hiring_forecasts CASCADE;
DROP TABLE IF EXISTS org_unit_skill_requirements CASCADE;
DROP TABLE IF EXISTS capacity_plans CASCADE;
DROP TABLE IF EXISTS employee_assignments CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS job_families CASCADE;
DROP TABLE IF EXISTS org_unit_relationships CASCADE;
DROP TABLE IF EXISTS org_units CASCADE;
DROP TABLE IF EXISTS ccnl_types CASCADE;
DROP TABLE IF EXISTS legal_entities CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS hierarchy_types CASCADE;
DROP TABLE IF EXISTS user_system_roles CASCADE;

-- Drop indexes explicitly (may already be dropped with CASCADE, but explicit for clarity)
DROP INDEX IF EXISTS idx_org_units_time_slice;
DROP INDEX IF EXISTS idx_org_rel_time_slice;
DROP INDEX IF EXISTS idx_employee_assignments;
DROP INDEX IF EXISTS idx_org_units_hierarchy;
DROP INDEX IF EXISTS idx_org_units_status;
DROP INDEX IF EXISTS idx_positions_unit;
DROP INDEX IF EXISTS idx_capacity_plans_unit;
DROP INDEX IF EXISTS idx_change_requests_status;
DROP INDEX IF EXISTS idx_locations_parent;
DROP INDEX IF EXISTS idx_locations_type;
DROP INDEX IF EXISTS idx_job_families_parent;
DROP INDEX IF EXISTS idx_positions_status;
DROP INDEX IF EXISTS idx_positions_job_family;
DROP INDEX IF EXISTS idx_employee_assignments_user;
DROP INDEX IF EXISTS idx_employee_assignments_org_unit;
DROP INDEX IF EXISTS idx_capacity_plans_status;
DROP INDEX IF EXISTS idx_org_unit_skills_priority;
DROP INDEX IF EXISTS idx_hiring_forecasts_plan;
DROP INDEX IF EXISTS idx_org_change_requests_unit;
DROP INDEX IF EXISTS idx_org_change_requests_requester;

-- Rollback complete
