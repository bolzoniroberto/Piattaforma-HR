CREATE TABLE "business_functions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"primo_livello_id" varchar,
	"secondo_livello_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calculation_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"formula" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "compensation" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice_fiscale" varchar(16) NOT NULL,
	"ral" numeric(12, 2),
	"valuta" varchar(3) DEFAULT 'EUR',
	"mbo_percentuale" integer,
	"mbo_target_euro" numeric(12, 2),
	"valido_da" timestamp NOT NULL,
	"valido_a" timestamp,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competencies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" varchar,
	"is_transversal" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competency_models" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"persona_type" varchar NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contatti" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice_fiscale" varchar(16) NOT NULL,
	"email" varchar NOT NULL,
	"telefono" varchar,
	"indirizzo" text,
	"cap" varchar(10),
	"citta" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "contatti_codice_fiscale_unique" UNIQUE("codice_fiscale"),
	CONSTRAINT "contatti_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "contratti" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice_fiscale" varchar(16) NOT NULL,
	"data_assunzione" timestamp,
	"data_fine_rapporto" timestamp,
	"data_cessazione" timestamp,
	"codice_contratto" varchar,
	"descrizione_contratto" varchar,
	"tipologia_contratto_termine" varchar,
	"qualifica" varchar,
	"livello" varchar,
	"job_title" varchar,
	"part_time_codice" varchar,
	"part_time_percentuale" integer,
	"part_time_data_inizio" timestamp,
	"part_time_data_fine" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_field_definitions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_name" varchar NOT NULL,
	"field_label" varchar NOT NULL,
	"field_type" varchar NOT NULL,
	"category" varchar NOT NULL,
	"section" varchar,
	"is_required" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_searchable" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0,
	"placeholder" varchar,
	"help_text" text,
	"validation_rules" jsonb,
	"options" jsonb,
	"default_value" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_field_values" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"value" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "development_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" varchar NOT NULL,
	"employee_user_id" varchar NOT NULL,
	"manager_user_id" varchar NOT NULL,
	"competencies_to_develop" jsonb,
	"development_goals" text NOT NULL,
	"action_items" jsonb,
	"manager_notes" text,
	"employee_notes" text,
	"feedback_session_date" timestamp,
	"review_date" timestamp,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_acceptances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"document_id" varchar NOT NULL,
	"accepted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"type" varchar NOT NULL,
	"file_path" varchar,
	"requires_acceptance" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "evaluation_cycles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"year" integer NOT NULL,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"self_assessment_start" timestamp,
	"self_assessment_end" timestamp,
	"peer_feedback_start" timestamp,
	"peer_feedback_end" timestamp,
	"manager_evaluation_start" timestamp,
	"manager_evaluation_end" timestamp,
	"feedback_delivery_start" timestamp,
	"feedback_delivery_end" timestamp,
	"enable_360_feedback" boolean DEFAULT false NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "evaluation_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"notification_type" varchar NOT NULL,
	"phase" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "indicator_clusters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manager_evaluations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" varchar NOT NULL,
	"employee_user_id" varchar NOT NULL,
	"manager_user_id" varchar NOT NULL,
	"competency_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mbo_regulation_acceptances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"accepted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "objective_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"objective_id" varchar NOT NULL,
	"weight" integer,
	"status" varchar DEFAULT 'assegnato' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "objectives" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dictionary_id" varchar NOT NULL,
	"cluster_id" varchar NOT NULL,
	"deadline" timestamp,
	"actual_value" numeric(15, 2),
	"qualitative_result" varchar,
	"reported_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "objectives_dictionary" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"indicator_cluster_id" varchar NOT NULL,
	"calculation_type_id" varchar NOT NULL,
	"objective_type" varchar DEFAULT 'numeric' NOT NULL,
	"target_value" numeric(15, 2),
	"threshold_value" numeric(15, 2),
	"actual_value" numeric(15, 2),
	"qualitative_result" varchar,
	"reported_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizzazione" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice_fiscale" varchar(16) NOT NULL,
	"codice_azienda" varchar,
	"azienda" varchar,
	"codice_struttura_l1" varchar,
	"descrizione_struttura_l1" varchar,
	"codice_struttura_l2" varchar,
	"descrizione_struttura_l2" varchar,
	"codice_struttura_l3" varchar,
	"descrizione_struttura_l3" varchar,
	"codice_cdc" varchar,
	"descrizione_cdc" varchar,
	"area" varchar,
	"sotto_area" varchar,
	"unita_organizzativa" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organizzazione_codice_fiscale_unique" UNIQUE("codice_fiscale")
);
--> statement-breakpoint
CREATE TABLE "peer_feedback_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" varchar NOT NULL,
	"requestor_user_id" varchar NOT NULL,
	"peer_user_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "peer_feedbacks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" varchar NOT NULL,
	"cycle_id" varchar NOT NULL,
	"requestor_user_id" varchar NOT NULL,
	"peer_user_id" varchar NOT NULL,
	"competency_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"is_anonymous" boolean DEFAULT true NOT NULL,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "persona" (
	"codice_fiscale" varchar(16) PRIMARY KEY NOT NULL,
	"cognome" varchar NOT NULL,
	"nome" varchar NOT NULL,
	"data_nascita" timestamp,
	"sesso" varchar(1),
	"cittadinanza" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ruoli" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice_fiscale" varchar(16) NOT NULL,
	"primo_responsabile_cf" varchar(16),
	"responsabile_diretto_cf" varchar(16),
	"reports_to_cf" varchar(16),
	"is_tns" boolean DEFAULT false,
	"is_sgsl" boolean DEFAULT false,
	"is_privacy" boolean DEFAULT false,
	"role" varchar DEFAULT 'employee' NOT NULL,
	"profile_image_url" varchar,
	"mbo_regulation_accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ruoli_codice_fiscale_unique" UNIQUE("codice_fiscale")
);
--> statement-breakpoint
CREATE TABLE "self_assessments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"competency_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_competency_model_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"competency_model_id" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"assigned_by" varchar,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_to" timestamp,
	"is_current" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"codice_fiscale" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'employee' NOT NULL,
	"department" varchar,
	"cdc" varchar,
	"manager_id" varchar,
	"ral" numeric(12, 2),
	"mbo_percentage" integer,
	"mbo_regulation_accepted_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"telefono" varchar,
	"indirizzo" text,
	"cap" varchar(10),
	"citta" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "compensation" ADD CONSTRAINT "compensation_codice_fiscale_persona_codice_fiscale_fk" FOREIGN KEY ("codice_fiscale") REFERENCES "public"."persona"("codice_fiscale") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_model_id_competency_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."competency_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_models" ADD CONSTRAINT "competency_models_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contatti" ADD CONSTRAINT "contatti_codice_fiscale_persona_codice_fiscale_fk" FOREIGN KEY ("codice_fiscale") REFERENCES "public"."persona"("codice_fiscale") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratti" ADD CONSTRAINT "contratti_codice_fiscale_persona_codice_fiscale_fk" FOREIGN KEY ("codice_fiscale") REFERENCES "public"."persona"("codice_fiscale") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_field_id_custom_field_definitions_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."custom_field_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "development_plans" ADD CONSTRAINT "development_plans_cycle_id_evaluation_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."evaluation_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "development_plans" ADD CONSTRAINT "development_plans_employee_user_id_users_id_fk" FOREIGN KEY ("employee_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "development_plans" ADD CONSTRAINT "development_plans_manager_user_id_users_id_fk" FOREIGN KEY ("manager_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_acceptances" ADD CONSTRAINT "document_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_acceptances" ADD CONSTRAINT "document_acceptances_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_cycles" ADD CONSTRAINT "evaluation_cycles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_notifications" ADD CONSTRAINT "evaluation_notifications_cycle_id_evaluation_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."evaluation_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_notifications" ADD CONSTRAINT "evaluation_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_evaluations" ADD CONSTRAINT "manager_evaluations_cycle_id_evaluation_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."evaluation_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_evaluations" ADD CONSTRAINT "manager_evaluations_employee_user_id_users_id_fk" FOREIGN KEY ("employee_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_evaluations" ADD CONSTRAINT "manager_evaluations_manager_user_id_users_id_fk" FOREIGN KEY ("manager_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_evaluations" ADD CONSTRAINT "manager_evaluations_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mbo_regulation_acceptances" ADD CONSTRAINT "mbo_regulation_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objective_assignments" ADD CONSTRAINT "objective_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objective_assignments" ADD CONSTRAINT "objective_assignments_objective_id_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."objectives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_dictionary_id_objectives_dictionary_id_fk" FOREIGN KEY ("dictionary_id") REFERENCES "public"."objectives_dictionary"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_cluster_id_indicator_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."indicator_clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objectives_dictionary" ADD CONSTRAINT "objectives_dictionary_indicator_cluster_id_indicator_clusters_id_fk" FOREIGN KEY ("indicator_cluster_id") REFERENCES "public"."indicator_clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objectives_dictionary" ADD CONSTRAINT "objectives_dictionary_calculation_type_id_calculation_types_id_fk" FOREIGN KEY ("calculation_type_id") REFERENCES "public"."calculation_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizzazione" ADD CONSTRAINT "organizzazione_codice_fiscale_persona_codice_fiscale_fk" FOREIGN KEY ("codice_fiscale") REFERENCES "public"."persona"("codice_fiscale") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_feedback_requests" ADD CONSTRAINT "peer_feedback_requests_cycle_id_evaluation_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."evaluation_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_feedback_requests" ADD CONSTRAINT "peer_feedback_requests_requestor_user_id_users_id_fk" FOREIGN KEY ("requestor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_feedback_requests" ADD CONSTRAINT "peer_feedback_requests_peer_user_id_users_id_fk" FOREIGN KEY ("peer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_feedbacks" ADD CONSTRAINT "peer_feedbacks_request_id_peer_feedback_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."peer_feedback_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_feedbacks" ADD CONSTRAINT "peer_feedbacks_cycle_id_evaluation_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."evaluation_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_feedbacks" ADD CONSTRAINT "peer_feedbacks_requestor_user_id_users_id_fk" FOREIGN KEY ("requestor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_feedbacks" ADD CONSTRAINT "peer_feedbacks_peer_user_id_users_id_fk" FOREIGN KEY ("peer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_feedbacks" ADD CONSTRAINT "peer_feedbacks_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruoli" ADD CONSTRAINT "ruoli_codice_fiscale_persona_codice_fiscale_fk" FOREIGN KEY ("codice_fiscale") REFERENCES "public"."persona"("codice_fiscale") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruoli" ADD CONSTRAINT "ruoli_primo_responsabile_cf_persona_codice_fiscale_fk" FOREIGN KEY ("primo_responsabile_cf") REFERENCES "public"."persona"("codice_fiscale") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruoli" ADD CONSTRAINT "ruoli_responsabile_diretto_cf_persona_codice_fiscale_fk" FOREIGN KEY ("responsabile_diretto_cf") REFERENCES "public"."persona"("codice_fiscale") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruoli" ADD CONSTRAINT "ruoli_reports_to_cf_persona_codice_fiscale_fk" FOREIGN KEY ("reports_to_cf") REFERENCES "public"."persona"("codice_fiscale") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "self_assessments" ADD CONSTRAINT "self_assessments_cycle_id_evaluation_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."evaluation_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "self_assessments" ADD CONSTRAINT "self_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "self_assessments" ADD CONSTRAINT "self_assessments_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_competency_model_assignments" ADD CONSTRAINT "user_competency_model_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_competency_model_assignments" ADD CONSTRAINT "user_competency_model_assignments_competency_model_id_competency_models_id_fk" FOREIGN KEY ("competency_model_id") REFERENCES "public"."competency_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_competency_model_assignments" ADD CONSTRAINT "user_competency_model_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_field_user" ON "custom_field_values" USING btree ("field_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_development_plan" ON "development_plans" USING btree ("cycle_id","employee_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_document" ON "document_acceptances" USING btree ("user_id","document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_manager_evaluation" ON "manager_evaluations" USING btree ("cycle_id","employee_user_id","competency_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_mbo_user_acceptance" ON "mbo_regulation_acceptances" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_objective" ON "objective_assignments" USING btree ("user_id","objective_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_peer_request" ON "peer_feedback_requests" USING btree ("cycle_id","requestor_user_id","peer_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_peer_feedback" ON "peer_feedbacks" USING btree ("request_id","competency_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_self_assessment" ON "self_assessments" USING btree ("cycle_id","user_id","competency_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_model_current" ON "user_competency_model_assignments" USING btree ("user_id","competency_model_id","is_current");