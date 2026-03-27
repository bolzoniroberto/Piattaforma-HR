CREATE TABLE `business_functions` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`primo_livello_id` text,
	`secondo_livello_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `calculation_types` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`formula` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `categorie_protette` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`codice` text(50) NOT NULL,
	`descrizione` text(255) NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categorie_protette_codice_unique` ON `categorie_protette` (`codice`);--> statement-breakpoint
CREATE TABLE `causali_assunzione` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`codice` text(50) NOT NULL,
	`descrizione` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `causali_assunzione_codice_unique` ON `causali_assunzione` (`codice`);--> statement-breakpoint
CREATE TABLE `ccnl` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`codice_ccnl` text(50) NOT NULL,
	`descrizione_ccnl` text(255) NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ccnl_codice_ccnl_unique` ON `ccnl` (`codice_ccnl`);--> statement-breakpoint
CREATE TABLE `compensation` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`codice_fiscale` text(16) NOT NULL,
	`ral` real,
	`valuta` text(3) DEFAULT 'EUR',
	`mbo_percentuale` integer,
	`mbo_target_euro` real,
	`valido_da` integer NOT NULL,
	`valido_a` integer,
	`is_current` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`codice_fiscale`) REFERENCES `persona`(`codice_fiscale`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `competencies` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`model_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`is_transversal` integer DEFAULT 0 NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`model_id`) REFERENCES `competency_models`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `competency_models` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`persona_type` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `configurazioni_orario` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`codice` text(50) NOT NULL,
	`tipo` text(50) NOT NULL,
	`descrizione` text(255) NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `configurazioni_orario_codice_unique` ON `configurazioni_orario` (`codice`);--> statement-breakpoint
CREATE TABLE `contatti` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`codice_fiscale` text(16) NOT NULL,
	`email` text NOT NULL,
	`telefono` text,
	`indirizzo` text,
	`cap` text(10),
	`citta` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`codice_fiscale`) REFERENCES `persona`(`codice_fiscale`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contatti_codice_fiscale_unique` ON `contatti` (`codice_fiscale`);--> statement-breakpoint
CREATE UNIQUE INDEX `contatti_email_unique` ON `contatti` (`email`);--> statement-breakpoint
CREATE TABLE `contratti` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`codice_fiscale` text(16) NOT NULL,
	`matricola` text(50),
	`data_assunzione` integer,
	`data_assunzione_gruppo` integer,
	`data_fine_rapporto` integer,
	`data_cessazione` integer,
	`data_scadenza_posizione_lavorativa` integer,
	`data_scadenza_contratto_termine` integer,
	`codice_contratto` text,
	`descrizione_contratto` text,
	`tipologia_contratto_termine` text,
	`causale_assunzione_id` text,
	`qualifica` text,
	`livello` text,
	`job_title` text,
	`ccnl_id` text,
	`livello_contrattuale_id` text,
	`part_time_codice` text,
	`part_time_percentuale` integer,
	`descrizione_part_time` text(255),
	`part_time_data_inizio` integer,
	`part_time_data_fine` integer,
	`categoria_protetta_id` text,
	`azienda_provenienza` text(255),
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`codice_fiscale`) REFERENCES `persona`(`codice_fiscale`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`causale_assunzione_id`) REFERENCES `causali_assunzione`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ccnl_id`) REFERENCES `ccnl`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`livello_contrattuale_id`) REFERENCES `livelli_contrattuali`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoria_protetta_id`) REFERENCES `categorie_protette`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_contratti_matricola` ON `contratti` (`matricola`);--> statement-breakpoint
CREATE INDEX `idx_contratti_ccnl` ON `contratti` (`ccnl_id`);--> statement-breakpoint
CREATE INDEX `idx_contratti_livello` ON `contratti` (`livello_contrattuale_id`);--> statement-breakpoint
CREATE INDEX `idx_contratti_ccnl_livello` ON `contratti` (`ccnl_id`,`livello_contrattuale_id`) WHERE "contratti"."is_active" = true;--> statement-breakpoint
CREATE INDEX `idx_contratti_categoria_protetta` ON `contratti` (`categoria_protetta_id`) WHERE "contratti"."categoria_protetta_id" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `custom_field_definitions` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`field_name` text NOT NULL,
	`field_label` text NOT NULL,
	`field_type` text NOT NULL,
	`category` text NOT NULL,
	`section` text,
	`is_required` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`is_searchable` integer DEFAULT 0 NOT NULL,
	`display_order` integer DEFAULT 0,
	`placeholder` text,
	`help_text` text,
	`validation_rules` text,
	`options` text,
	`default_value` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `custom_field_values` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`field_id` text NOT NULL,
	`user_id` text NOT NULL,
	`value` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`field_id`) REFERENCES `custom_field_definitions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_field_user` ON `custom_field_values` (`field_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `development_plans` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`cycle_id` text NOT NULL,
	`employee_user_id` text NOT NULL,
	`manager_user_id` text NOT NULL,
	`competencies_to_develop` text,
	`development_goals` text NOT NULL,
	`action_items` text,
	`manager_notes` text,
	`employee_notes` text,
	`feedback_session_date` integer,
	`review_date` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`manager_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_development_plan` ON `development_plans` (`cycle_id`,`employee_user_id`);--> statement-breakpoint
CREATE TABLE `document_acceptances` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`user_id` text NOT NULL,
	`document_id` text NOT NULL,
	`accepted_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_document` ON `document_acceptances` (`user_id`,`document_id`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`file_path` text,
	`requires_acceptance` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `evaluation_cycles` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`name` text NOT NULL,
	`year` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`self_assessment_start` integer,
	`self_assessment_end` integer,
	`peer_feedback_start` integer,
	`peer_feedback_end` integer,
	`manager_evaluation_start` integer,
	`manager_evaluation_end` integer,
	`feedback_delivery_start` integer,
	`feedback_delivery_end` integer,
	`enable_360_feedback` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `evaluation_notifications` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`cycle_id` text NOT NULL,
	`user_id` text NOT NULL,
	`notification_type` text NOT NULL,
	`phase` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer DEFAULT 0 NOT NULL,
	`sent_at` integer DEFAULT (unixepoch()),
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `indicator_clusters` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `livelli_contrattuali` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`ccnl_id` text NOT NULL,
	`codice_livello` text(50) NOT NULL,
	`descrizione_livello` text(255) NOT NULL,
	`ordinamento` integer DEFAULT 0,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`ccnl_id`) REFERENCES `ccnl`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_ccnl_livello` ON `livelli_contrattuali` (`ccnl_id`,`codice_livello`);--> statement-breakpoint
CREATE TABLE `livelli_contrattuali_storico` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`contratto_id` text NOT NULL,
	`livello_contrattuale_id` text,
	`data_decorrenza` integer NOT NULL,
	`data_fine` integer,
	`is_current` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`contratto_id`) REFERENCES `contratti`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`livello_contrattuale_id`) REFERENCES `livelli_contrattuali`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_livelli_storico_contratto` ON `livelli_contrattuali_storico` (`contratto_id`);--> statement-breakpoint
CREATE INDEX `idx_livelli_storico_current` ON `livelli_contrattuali_storico` (`contratto_id`,`is_current`) WHERE "livelli_contrattuali_storico"."is_current" = true;--> statement-breakpoint
CREATE TABLE `manager_evaluations` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`cycle_id` text NOT NULL,
	`employee_user_id` text NOT NULL,
	`manager_user_id` text NOT NULL,
	`competency_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`submitted_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`manager_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`competency_id`) REFERENCES `competencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_manager_evaluation` ON `manager_evaluations` (`cycle_id`,`employee_user_id`,`competency_id`);--> statement-breakpoint
CREATE TABLE `mbo_regulation_acceptances` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`user_id` text NOT NULL,
	`accepted_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_mbo_user_acceptance` ON `mbo_regulation_acceptances` (`user_id`);--> statement-breakpoint
CREATE TABLE `objective_assignments` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`user_id` text NOT NULL,
	`objective_id` text NOT NULL,
	`weight` integer,
	`status` text DEFAULT 'assegnato' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`assigned_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`objective_id`) REFERENCES `objectives`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_objective` ON `objective_assignments` (`user_id`,`objective_id`);--> statement-breakpoint
CREATE TABLE `objectives` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`dictionary_id` text NOT NULL,
	`cluster_id` text NOT NULL,
	`deadline` integer,
	`actual_value` real,
	`qualitative_result` text,
	`reported_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`dictionary_id`) REFERENCES `objectives_dictionary`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`cluster_id`) REFERENCES `indicator_clusters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `objectives_dictionary` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`indicator_cluster_id` text NOT NULL,
	`calculation_type_id` text NOT NULL,
	`objective_type` text DEFAULT 'numeric' NOT NULL,
	`target_value` real,
	`threshold_value` real,
	`actual_value` real,
	`qualitative_result` text,
	`reported_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`indicator_cluster_id`) REFERENCES `indicator_clusters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`calculation_type_id`) REFERENCES `calculation_types`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `organizzazione` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`codice_fiscale` text(16) NOT NULL,
	`codice_azienda` text,
	`azienda` text,
	`codice_struttura_l1` text,
	`descrizione_struttura_l1` text,
	`codice_struttura_l2` text,
	`descrizione_struttura_l2` text,
	`codice_struttura_l3` text,
	`descrizione_struttura_l3` text,
	`codice_cdc` text,
	`descrizione_cdc` text,
	`area` text,
	`sotto_area` text,
	`unita_organizzativa` text,
	`sede_id` text,
	`data_decorrenza_sede` integer,
	`sindacato` text(100),
	`configurazione_orario_id` text,
	`configurazione_timbra_firma_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`codice_fiscale`) REFERENCES `persona`(`codice_fiscale`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sede_id`) REFERENCES `sedi`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`configurazione_orario_id`) REFERENCES `configurazioni_orario`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`configurazione_timbra_firma_id`) REFERENCES `configurazioni_orario`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizzazione_codice_fiscale_unique` ON `organizzazione` (`codice_fiscale`);--> statement-breakpoint
CREATE INDEX `idx_organizzazione_sede` ON `organizzazione` (`sede_id`) WHERE "organizzazione"."sede_id" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `overall_self_assessments` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`cycle_id` text NOT NULL,
	`user_id` text NOT NULL,
	`overall_rating` integer NOT NULL,
	`overall_comment` text NOT NULL,
	`strengths` text,
	`areas_for_improvement` text,
	`goals` text,
	`submitted_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_overall_self_assessment` ON `overall_self_assessments` (`cycle_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `peer_feedback_requests` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`cycle_id` text NOT NULL,
	`requestor_user_id` text NOT NULL,
	`peer_user_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_at` integer DEFAULT (unixepoch()),
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requestor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`peer_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_peer_request` ON `peer_feedback_requests` (`cycle_id`,`requestor_user_id`,`peer_user_id`);--> statement-breakpoint
CREATE TABLE `peer_feedbacks` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`request_id` text NOT NULL,
	`cycle_id` text NOT NULL,
	`requestor_user_id` text NOT NULL,
	`peer_user_id` text NOT NULL,
	`competency_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`is_anonymous` integer DEFAULT 1 NOT NULL,
	`submitted_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`request_id`) REFERENCES `peer_feedback_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requestor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`peer_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`competency_id`) REFERENCES `competencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_peer_feedback` ON `peer_feedbacks` (`request_id`,`competency_id`);--> statement-breakpoint
CREATE TABLE `persona` (
	`codice_fiscale` text(16) PRIMARY KEY NOT NULL,
	`matricola` text(50),
	`cognome` text NOT NULL,
	`nome` text NOT NULL,
	`data_nascita` integer,
	`sesso` text(1),
	`cittadinanza` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `persona_matricola_unique` ON `persona` (`matricola`);--> statement-breakpoint
CREATE INDEX `idx_persona_matricola` ON `persona` (`matricola`);--> statement-breakpoint
CREATE TABLE `ruoli` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`codice_fiscale` text(16) NOT NULL,
	`primo_responsabile_cf` text(16),
	`responsabile_diretto_cf` text(16),
	`reports_to_cf` text(16),
	`is_tns` integer DEFAULT false,
	`is_sgsl` integer DEFAULT false,
	`is_privacy` integer DEFAULT false,
	`role` text DEFAULT 'employee' NOT NULL,
	`profile_image_url` text,
	`mbo_regulation_accepted_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`codice_fiscale`) REFERENCES `persona`(`codice_fiscale`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`primo_responsabile_cf`) REFERENCES `persona`(`codice_fiscale`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`responsabile_diretto_cf`) REFERENCES `persona`(`codice_fiscale`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reports_to_cf`) REFERENCES `persona`(`codice_fiscale`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ruoli_codice_fiscale_unique` ON `ruoli` (`codice_fiscale`);--> statement-breakpoint
CREATE INDEX `idx_ruoli_hierarchy` ON `ruoli` (`responsabile_diretto_cf`,`codice_fiscale`) WHERE "ruoli"."responsabile_diretto_cf" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `sedi` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`codice_sede` text(50) NOT NULL,
	`descrizione_sede` text(255) NOT NULL,
	`comune` text(100),
	`indirizzo` text,
	`cap` text(10),
	`provincia` text(2),
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sedi_codice_sede_unique` ON `sedi` (`codice_sede`);--> statement-breakpoint
CREATE TABLE `self_assessments` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`cycle_id` text NOT NULL,
	`user_id` text NOT NULL,
	`competency_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`submitted_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`competency_id`) REFERENCES `competencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_self_assessment` ON `self_assessments` (`cycle_id`,`user_id`,`competency_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);--> statement-breakpoint
CREATE TABLE `smart_working_storico` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`codice_fiscale` text(16) NOT NULL,
	`tipologia_smart_working` text(100) NOT NULL,
	`data_decorrenza` integer NOT NULL,
	`data_scadenza` integer,
	`is_current` integer DEFAULT 1 NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`codice_fiscale`) REFERENCES `persona`(`codice_fiscale`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sw_storico_cf` ON `smart_working_storico` (`codice_fiscale`);--> statement-breakpoint
CREATE INDEX `idx_sw_storico_current` ON `smart_working_storico` (`codice_fiscale`,`is_current`) WHERE "smart_working_storico"."is_current" = true;--> statement-breakpoint
CREATE TABLE `user_competency_model_assignments` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`user_id` text NOT NULL,
	`competency_model_id` text NOT NULL,
	`assigned_at` integer DEFAULT (unixepoch()),
	`assigned_by` text,
	`valid_from` integer DEFAULT (unixepoch()) NOT NULL,
	`valid_to` integer,
	`is_current` integer DEFAULT 1 NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`competency_model_id`) REFERENCES `competency_models`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_model_current` ON `user_competency_model_assignments` (`user_id`,`competency_model_id`,`is_current`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`email` text,
	`first_name` text,
	`last_name` text,
	`codice_fiscale` text(16),
	`matricola` text(50),
	`profile_image_url` text,
	`role` text DEFAULT 'employee' NOT NULL,
	`department` text,
	`cdc` text,
	`manager_id` text,
	`ral` real,
	`mbo_percentage` integer,
	`mbo_regulation_accepted_at` integer,
	`is_active` integer DEFAULT 1 NOT NULL,
	`telefono` text,
	`indirizzo` text,
	`cap` text(10),
	`citta` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_codice_fiscale_unique` ON `users` (`codice_fiscale`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_matricola_unique` ON `users` (`matricola`);--> statement-breakpoint
CREATE INDEX `idx_users_codice_fiscale` ON `users` (`codice_fiscale`);--> statement-breakpoint
CREATE INDEX `idx_users_matricola` ON `users` (`matricola`);