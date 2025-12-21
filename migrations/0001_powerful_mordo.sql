CREATE TABLE "overall_self_assessments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"overall_rating" integer NOT NULL,
	"overall_comment" text NOT NULL,
	"strengths" text,
	"areas_for_improvement" text,
	"goals" text,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "overall_self_assessments" ADD CONSTRAINT "overall_self_assessments_cycle_id_evaluation_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."evaluation_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overall_self_assessments" ADD CONSTRAINT "overall_self_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_overall_self_assessment" ON "overall_self_assessments" USING btree ("cycle_id","user_id");