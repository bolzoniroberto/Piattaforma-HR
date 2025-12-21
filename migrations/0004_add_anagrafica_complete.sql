-- Migration: Add Complete Italian HR Registry (Anagrafica Completa)
-- Created: 2025-12-19
-- Purpose: Add lookup tables, history tables, and extend existing tables for Italian HR compliance
-- Phase 1: Database Schema Implementation

-- ==============================================
-- SECTION 1: CREATE LOOKUP TABLES
-- ==============================================

-- Sedi - Anagrafica Sedi di Lavoro
CREATE TABLE IF NOT EXISTS "sedi" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice_sede" varchar(50) UNIQUE NOT NULL,
	"descrizione_sede" varchar(255) NOT NULL,
	"comune" varchar(100),
	"indirizzo" text,
	"cap" varchar(10),
	"provincia" varchar(2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- CCNL - Contratti Collettivi Nazionali Lavoro
CREATE TABLE IF NOT EXISTS "ccnl" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice_ccnl" varchar(50) UNIQUE NOT NULL,
	"descrizione_ccnl" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Livelli Contrattuali - Livelli per CCNL
CREATE TABLE IF NOT EXISTS "livelli_contrattuali" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ccnl_id" varchar NOT NULL,
	"codice_livello" varchar(50) NOT NULL,
	"descrizione_livello" varchar(255) NOT NULL,
	"ordinamento" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Categorie Protette - Categorie L.68/99 (Dati Sensibili)
CREATE TABLE IF NOT EXISTS "categorie_protette" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice" varchar(50) UNIQUE NOT NULL,
	"descrizione" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Configurazioni Orario - Tipologie Orario e Timbratura
CREATE TABLE IF NOT EXISTS "configurazioni_orario" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice" varchar(50) UNIQUE NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"descrizione" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Causali Assunzione - Causali Assunzione
CREATE TABLE IF NOT EXISTS "causali_assunzione" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice" varchar(50) UNIQUE NOT NULL,
	"descrizione" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- ==============================================
-- SECTION 2: CREATE HISTORY TABLES
-- ==============================================

-- Smart Working Storico - Storico Smart Working
CREATE TABLE IF NOT EXISTS "smart_working_storico" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice_fiscale" varchar(16) NOT NULL,
	"tipologia_smart_working" varchar(100) NOT NULL,
	"data_decorrenza" timestamp NOT NULL,
	"data_scadenza" timestamp,
	"is_current" boolean DEFAULT true NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Livelli Contrattuali Storico - Storico Cambi Livello
CREATE TABLE IF NOT EXISTS "livelli_contrattuali_storico" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contratto_id" varchar NOT NULL,
	"livello_contrattuale_id" varchar,
	"data_decorrenza" timestamp NOT NULL,
	"data_fine" timestamp,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- ==============================================
-- SECTION 3: EXTEND EXISTING TABLES
-- ==============================================

-- Extend persona table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='persona' AND column_name='matricola') THEN
    ALTER TABLE "persona" ADD COLUMN "matricola" varchar(50) UNIQUE;
  END IF;
END $$;
--> statement-breakpoint

-- Extend users table for linking
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='codice_fiscale') THEN
    ALTER TABLE "users" ADD COLUMN "codice_fiscale" varchar(16) UNIQUE;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='matricola') THEN
    ALTER TABLE "users" ADD COLUMN "matricola" varchar(50) UNIQUE;
  END IF;
END $$;
--> statement-breakpoint

-- Extend contratti table with new fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratti' AND column_name='matricola') THEN
    ALTER TABLE "contratti" ADD COLUMN "matricola" varchar(50);
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratti' AND column_name='data_assunzione_gruppo') THEN
    ALTER TABLE "contratti" ADD COLUMN "data_assunzione_gruppo" timestamp;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratti' AND column_name='causale_assunzione_id') THEN
    ALTER TABLE "contratti" ADD COLUMN "causale_assunzione_id" varchar;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratti' AND column_name='data_scadenza_posizione_lavorativa') THEN
    ALTER TABLE "contratti" ADD COLUMN "data_scadenza_posizione_lavorativa" timestamp;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratti' AND column_name='data_scadenza_contratto_termine') THEN
    ALTER TABLE "contratti" ADD COLUMN "data_scadenza_contratto_termine" timestamp;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratti' AND column_name='descrizione_part_time') THEN
    ALTER TABLE "contratti" ADD COLUMN "descrizione_part_time" varchar(255);
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratti' AND column_name='azienda_provenienza') THEN
    ALTER TABLE "contratti" ADD COLUMN "azienda_provenienza" varchar(255);
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratti' AND column_name='ccnl_id') THEN
    ALTER TABLE "contratti" ADD COLUMN "ccnl_id" varchar;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratti' AND column_name='livello_contrattuale_id') THEN
    ALTER TABLE "contratti" ADD COLUMN "livello_contrattuale_id" varchar;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contratti' AND column_name='categoria_protetta_id') THEN
    ALTER TABLE "contratti" ADD COLUMN "categoria_protetta_id" varchar;
  END IF;
END $$;
--> statement-breakpoint

-- Extend organizzazione table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizzazione' AND column_name='sede_id') THEN
    ALTER TABLE "organizzazione" ADD COLUMN "sede_id" varchar;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizzazione' AND column_name='data_decorrenza_sede') THEN
    ALTER TABLE "organizzazione" ADD COLUMN "data_decorrenza_sede" timestamp;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizzazione' AND column_name='sindacato') THEN
    ALTER TABLE "organizzazione" ADD COLUMN "sindacato" varchar(100);
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizzazione' AND column_name='configurazione_orario_id') THEN
    ALTER TABLE "organizzazione" ADD COLUMN "configurazione_orario_id" varchar;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizzazione' AND column_name='configurazione_timbra_firma_id') THEN
    ALTER TABLE "organizzazione" ADD COLUMN "configurazione_timbra_firma_id" varchar;
  END IF;
END $$;
--> statement-breakpoint

-- ==============================================
-- SECTION 4: ADD FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Livelli Contrattuali -> CCNL
ALTER TABLE "livelli_contrattuali" ADD CONSTRAINT "livelli_contrattuali_ccnl_id_ccnl_id_fk" FOREIGN KEY ("ccnl_id") REFERENCES "public"."ccnl"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Smart Working Storico -> Persona
ALTER TABLE "smart_working_storico" ADD CONSTRAINT "smart_working_storico_codice_fiscale_persona_codice_fiscale_fk" FOREIGN KEY ("codice_fiscale") REFERENCES "public"."persona"("codice_fiscale") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Livelli Contrattuali Storico -> Contratti
ALTER TABLE "livelli_contrattuali_storico" ADD CONSTRAINT "livelli_contrattuali_storico_contratto_id_contratti_id_fk" FOREIGN KEY ("contratto_id") REFERENCES "public"."contratti"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Livelli Contrattuali Storico -> Livelli Contrattuali
ALTER TABLE "livelli_contrattuali_storico" ADD CONSTRAINT "livelli_contrattuali_storico_livello_contrattuale_id_livelli_contrattuali_id_fk" FOREIGN KEY ("livello_contrattuale_id") REFERENCES "public"."livelli_contrattuali"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Contratti -> Causali Assunzione
ALTER TABLE "contratti" ADD CONSTRAINT "contratti_causale_assunzione_id_causali_assunzione_id_fk" FOREIGN KEY ("causale_assunzione_id") REFERENCES "public"."causali_assunzione"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Contratti -> CCNL
ALTER TABLE "contratti" ADD CONSTRAINT "contratti_ccnl_id_ccnl_id_fk" FOREIGN KEY ("ccnl_id") REFERENCES "public"."ccnl"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Contratti -> Livelli Contrattuali
ALTER TABLE "contratti" ADD CONSTRAINT "contratti_livello_contrattuale_id_livelli_contrattuali_id_fk" FOREIGN KEY ("livello_contrattuale_id") REFERENCES "public"."livelli_contrattuali"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Contratti -> Categorie Protette
ALTER TABLE "contratti" ADD CONSTRAINT "contratti_categoria_protetta_id_categorie_protette_id_fk" FOREIGN KEY ("categoria_protetta_id") REFERENCES "public"."categorie_protette"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Organizzazione -> Sedi
ALTER TABLE "organizzazione" ADD CONSTRAINT "organizzazione_sede_id_sedi_id_fk" FOREIGN KEY ("sede_id") REFERENCES "public"."sedi"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Organizzazione -> Configurazioni Orario (tipo_orario)
ALTER TABLE "organizzazione" ADD CONSTRAINT "organizzazione_configurazione_orario_id_configurazioni_orario_id_fk" FOREIGN KEY ("configurazione_orario_id") REFERENCES "public"."configurazioni_orario"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Organizzazione -> Configurazioni Orario (timbra_firma)
ALTER TABLE "organizzazione" ADD CONSTRAINT "organizzazione_configurazione_timbra_firma_id_configurazioni_orario_id_fk" FOREIGN KEY ("configurazione_timbra_firma_id") REFERENCES "public"."configurazioni_orario"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- ==============================================
-- SECTION 5: CREATE INDEXES
-- ==============================================

-- Unique composite index for CCNL + Livello
CREATE UNIQUE INDEX IF NOT EXISTS "unique_ccnl_livello" ON "livelli_contrattuali" USING btree ("ccnl_id","codice_livello");
--> statement-breakpoint

-- Index for persona.matricola
CREATE INDEX IF NOT EXISTS "idx_persona_matricola" ON "persona" USING btree ("matricola");
--> statement-breakpoint

-- Indexes for users table linking
CREATE INDEX IF NOT EXISTS "idx_users_codice_fiscale" ON "users" USING btree ("codice_fiscale");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_matricola" ON "users" USING btree ("matricola");
--> statement-breakpoint

-- Indexes for contratti table
CREATE INDEX IF NOT EXISTS "idx_contratti_matricola" ON "contratti" USING btree ("matricola");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contratti_ccnl" ON "contratti" USING btree ("ccnl_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contratti_livello" ON "contratti" USING btree ("livello_contrattuale_id");
--> statement-breakpoint

-- Partial index for active contracts with CCNL and level
CREATE INDEX IF NOT EXISTS "idx_contratti_ccnl_livello" ON "contratti" USING btree ("ccnl_id","livello_contrattuale_id") WHERE "is_active" = true;
--> statement-breakpoint

-- Partial index for protected categories (only where not null)
CREATE INDEX IF NOT EXISTS "idx_contratti_categoria_protetta" ON "contratti" USING btree ("categoria_protetta_id") WHERE "categoria_protetta_id" IS NOT NULL;
--> statement-breakpoint

-- Partial index for sede in organizzazione
CREATE INDEX IF NOT EXISTS "idx_organizzazione_sede" ON "organizzazione" USING btree ("sede_id") WHERE "sede_id" IS NOT NULL;
--> statement-breakpoint

-- Indexes for smart working history
CREATE INDEX IF NOT EXISTS "idx_sw_storico_cf" ON "smart_working_storico" USING btree ("codice_fiscale");
--> statement-breakpoint

-- Partial index for current smart working assignments
CREATE INDEX IF NOT EXISTS "idx_sw_storico_current" ON "smart_working_storico" USING btree ("codice_fiscale","is_current") WHERE "is_current" = true;
--> statement-breakpoint

-- Indexes for livelli contrattuali storico
CREATE INDEX IF NOT EXISTS "idx_livelli_storico_contratto" ON "livelli_contrattuali_storico" USING btree ("contratto_id");
--> statement-breakpoint

-- Partial index for current contract levels
CREATE INDEX IF NOT EXISTS "idx_livelli_storico_current" ON "livelli_contrattuali_storico" USING btree ("contratto_id","is_current") WHERE "is_current" = true;
--> statement-breakpoint

-- Org chart hierarchy index for ruoli
CREATE INDEX IF NOT EXISTS "idx_ruoli_hierarchy" ON "ruoli" USING btree ("responsabile_diretto_cf","codice_fiscale") WHERE "responsabile_diretto_cf" IS NOT NULL;
--> statement-breakpoint

-- Migration complete
