CREATE TABLE IF NOT EXISTS `employee_letters` (
	`id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
	`job_id` text REFERENCES `doc_generation_jobs`(`id`) ON DELETE SET NULL,
	`template_id` text REFERENCES `doc_templates`(`id`) ON DELETE SET NULL,
	`letter_type` text NOT NULL,
	`title` text NOT NULL,
	`file_path` text NOT NULL,
	`file_format` text NOT NULL DEFAULT 'pdf',
	`sha256` text NOT NULL,
	`requires_signature` integer NOT NULL DEFAULT 0,
	`due_date` integer,
	`status` text NOT NULL DEFAULT 'draft',
	`replaces_id` text,
	`published_by` text REFERENCES `users`(`id`) ON DELETE SET NULL,
	`published_at` integer,
	`viewed_at` integer,
	`signed_at` integer,
	`revoked_at` integer,
	`created_at` integer DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS `idx_employee_letters_user` ON `employee_letters` (`user_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_employee_letters_job` ON `employee_letters` (`job_id`);
