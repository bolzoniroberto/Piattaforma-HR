CREATE TABLE IF NOT EXISTS `doc_signers` (
	`id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
	`name` text NOT NULL,
	`role` text NOT NULL,
	`signature_image_path` text NOT NULL,
	`is_default` integer NOT NULL DEFAULT 0,
	`uploaded_at` integer DEFAULT (unixepoch())
);
