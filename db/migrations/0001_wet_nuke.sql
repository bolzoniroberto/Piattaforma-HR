CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `entry_gate` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`year` integer NOT NULL,
	`indicator_name` text NOT NULL,
	`target_value` real NOT NULL,
	`actual_value` real,
	`threshold_pct` integer DEFAULT 95 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
ALTER TABLE `objectives_dictionary` ADD `threshold_payout` real DEFAULT 50;--> statement-breakpoint
ALTER TABLE `objectives_dictionary` ADD `allow_overperformance` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `objectives_dictionary` ADD `max_payout` real DEFAULT 120;--> statement-breakpoint
ALTER TABLE `objectives_dictionary` ADD `target_description` text;--> statement-breakpoint
ALTER TABLE `objectives_dictionary` ADD `data_source` text;--> statement-breakpoint
ALTER TABLE `users` ADD `beneficiary_type` text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `hire_date` text;