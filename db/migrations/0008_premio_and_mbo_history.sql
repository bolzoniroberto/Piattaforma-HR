-- Premio MBO su users (campo separato da RAL)
ALTER TABLE `users` ADD COLUMN `premio` real;

-- Storico track record MBO (rendicontazioni anni passati)
CREATE TABLE IF NOT EXISTS `mbo_history` (
	`id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
	`user_id` text NOT NULL,
	`year` integer NOT NULL,
	`objective_code` text,
	`objective_type` text,
	`area` text,
	`indicatore` text,
	`weight` integer,
	`target` text,
	`consuntivo` text,
	`achievement_pct` integer,
	`effective_weight` real,
	`data_source` text,
	`referente` text,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS `idx_mbo_history_user` ON `mbo_history` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_mbo_history_user_year` ON `mbo_history` (`user_id`,`year`);
CREATE UNIQUE INDEX IF NOT EXISTS `unique_mbo_history_row` ON `mbo_history` (`user_id`,`year`,`objective_code`,`indicatore`);
