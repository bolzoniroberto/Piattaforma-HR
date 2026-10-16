CREATE TABLE IF NOT EXISTS `doc_logos` (
	`id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
	`name` text NOT NULL,
	`file_path` text NOT NULL,
	`uploaded_at` integer DEFAULT (unixepoch())
);
