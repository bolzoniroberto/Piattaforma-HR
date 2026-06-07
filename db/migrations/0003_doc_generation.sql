CREATE TABLE IF NOT EXISTS `doc_letterheads` (
	`id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
	`name` text NOT NULL,
	`description` text,
	`file_path` text NOT NULL,
	`uploaded_at` integer DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS `doc_templates` (
	`id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
	`name` text NOT NULL,
	`letter_type` text NOT NULL,
	`body_content` text NOT NULL DEFAULT '',
	`field_mappings` text NOT NULL DEFAULT '{}',
	`calculated_fields` text NOT NULL DEFAULT '{}',
	`parameters` text NOT NULL DEFAULT '[]',
	`version` integer NOT NULL DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS `doc_generation_jobs` (
	`id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
	`template_id` text NOT NULL REFERENCES `doc_templates`(`id`) ON DELETE CASCADE,
	`letterhead_id` text REFERENCES `doc_letterheads`(`id`) ON DELETE SET NULL,
	`excel_path` text NOT NULL,
	`params_snapshot` text NOT NULL DEFAULT '{}',
	`status` text NOT NULL DEFAULT 'pending',
	`beneficiary_count` integer NOT NULL DEFAULT 0,
	`output_zip_path` text,
	`created_by` text REFERENCES `users`(`id`) ON DELETE SET NULL,
	`created_at` integer DEFAULT (unixepoch())
);
