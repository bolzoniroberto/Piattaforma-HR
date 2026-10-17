CREATE TABLE IF NOT EXISTS `signature_requests` (
	`id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
	`letter_id` text NOT NULL REFERENCES `employee_letters`(`id`) ON DELETE CASCADE,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
	`code_hash` text NOT NULL,
	`sent_to` text NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer NOT NULL DEFAULT 0,
	`consumed_at` integer,
	`invalidated_at` integer,
	`request_ip` text,
	`created_at` integer NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS `idx_signature_requests_letter` ON `signature_requests` (`letter_id`, `created_at`);

CREATE TABLE IF NOT EXISTS `letter_signatures` (
	`id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
	`transaction_id` text NOT NULL UNIQUE,
	`letter_id` text NOT NULL UNIQUE REFERENCES `employee_letters`(`id`) ON DELETE RESTRICT,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE RESTRICT,
	`signature_request_id` text NOT NULL REFERENCES `signature_requests`(`id`),
	`method` text NOT NULL DEFAULT 'otp_email',
	`otp_sent_to` text NOT NULL,
	`declaration` text NOT NULL,
	`original_sha256` text NOT NULL,
	`signed_sha256` text,
	`signed_file_path` text,
	`ip` text,
	`user_agent` text,
	`signed_at` integer NOT NULL
);
