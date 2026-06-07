CREATE TABLE IF NOT EXISTS `ai_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
	`scope` text NOT NULL,
	`target_user_id` text REFERENCES `users`(`id`) ON DELETE SET NULL,
	`cycle_id` text,
	`state` text NOT NULL DEFAULT 'questioning',
	`turn_count` integer NOT NULL DEFAULT 0,
	`collected_facts` text NOT NULL DEFAULT '{}',
	`proposal` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS `ai_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL REFERENCES `ai_sessions`(`id`) ON DELETE CASCADE,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`question_key` text,
	`created_at` integer DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS `ai_invocations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`scope` text NOT NULL,
	`model` text NOT NULL,
	`tokens_in` integer NOT NULL DEFAULT 0,
	`tokens_out` integer NOT NULL DEFAULT 0,
	`estimated_centesimi` integer NOT NULL DEFAULT 0,
	`latency_ms` integer NOT NULL DEFAULT 0,
	`ok` integer NOT NULL DEFAULT 1,
	`error_msg` text,
	`created_at` integer DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS `idx_ai_invocations_user_id` ON `ai_invocations` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_ai_invocations_created_at` ON `ai_invocations` (`created_at`);
CREATE TABLE IF NOT EXISTS `ai_budget` (
	`month` text PRIMARY KEY NOT NULL,
	`spent_centesimi` integer NOT NULL DEFAULT 0,
	`updated_at` integer DEFAULT (unixepoch())
);
