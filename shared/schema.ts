import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  uniqueIndex,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  codiceFiscale: varchar("codice_fiscale", { length: 16 }).unique(), // Tax ID - FK to persona
  matricola: varchar("matricola", { length: 50 }).unique(), // Employee code - for quick lookup
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("employee"), // employee, admin, or hr
  department: varchar("department"),
  cdc: varchar("cdc"), // Centro di Costo (Cost Center)
  managerId: varchar("manager_id").references((): any => users.id, { onDelete: "set null" }), // Manager/responsabile
  ral: numeric("ral", { precision: 12, scale: 2 }), // Annual salary
  mboPercentage: integer("mbo_percentage"), // MBO percentage (in multiples of 5)
  mboRegulationAcceptedAt: timestamp("mbo_regulation_accepted_at"), // When user accepted MBO regulation
  isActive: boolean("is_active").notNull().default(true), // Whether user is active
  telefono: varchar("telefono"), // Phone number
  indirizzo: text("indirizzo"), // Address
  cap: varchar("cap", { length: 10 }), // Postal code
  citta: varchar("citta"), // City
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_codice_fiscale").on(table.codiceFiscale),
  index("idx_users_matricola").on(table.matricola),
]);

const baseUpsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  codiceFiscale: true,
  profileImageUrl: true,
  department: true,
  cdc: true,
  managerId: true,
  ral: true,
  mboPercentage: true,
  mboRegulationAcceptedAt: true,
  isActive: true,
  telefono: true,
  indirizzo: true,
  cap: true,
  citta: true,
});

export const upsertUserSchema = baseUpsertUserSchema.omit({
  ral: true,
  mboPercentage: true,
  isActive: true,
}).extend({
  ral: z.coerce.number().nullable().optional(),
  mboPercentage: z.number().int().min(0).max(100).refine((val) => val % 5 === 0, {
    message: "MBO percentage must be a multiple of 5%",
  }).optional(),
  isActive: z.boolean().optional(),
  telefono: z.string().nullable().optional(),
  indirizzo: z.string().nullable().optional(),
  cap: z.string().nullable().optional(),
  citta: z.string().nullable().optional(),
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// ==============================================
// NORMALIZED USER TABLES
// ==============================================

// Persona - Dati Anagrafici Base
export const persona = pgTable("persona", {
  codiceFiscale: varchar("codice_fiscale", { length: 16 }).primaryKey(),
  matricola: varchar("matricola", { length: 50 }).unique(),
  cognome: varchar("cognome").notNull(),
  nome: varchar("nome").notNull(),
  dataNascita: timestamp("data_nascita"),
  sesso: varchar("sesso", { length: 1 }), // M, F, A
  cittadinanza: varchar("cittadinanza"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_persona_matricola").on(table.matricola),
]);

export const insertPersonaSchema = createInsertSchema(persona).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertPersona = z.infer<typeof insertPersonaSchema>;
export type Persona = typeof persona.$inferSelect;

// Contatti - Informazioni di Contatto
export const contatti = pgTable("contatti", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codiceFiscale: varchar("codice_fiscale", { length: 16 }).notNull().unique().references(() => persona.codiceFiscale, { onDelete: "cascade" }),
  email: varchar("email").unique().notNull(),
  telefono: varchar("telefono"),
  indirizzo: text("indirizzo"),
  cap: varchar("cap", { length: 10 }),
  citta: varchar("citta"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContattiSchema = createInsertSchema(contatti).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContatti = z.infer<typeof insertContattiSchema>;
export type Contatti = typeof contatti.$inferSelect;

// Organizzazione - Struttura Aziendale
export const organizzazione = pgTable("organizzazione", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codiceFiscale: varchar("codice_fiscale", { length: 16 }).notNull().unique().references(() => persona.codiceFiscale, { onDelete: "cascade" }),
  codiceAzienda: varchar("codice_azienda"),
  azienda: varchar("azienda"),
  // Gerarchia strutturale (3 livelli)
  codiceStrutturaL1: varchar("codice_struttura_l1"),
  descrizioneStrutturaL1: varchar("descrizione_struttura_l1"),
  codiceStrutturaL2: varchar("codice_struttura_l2"),
  descrizioneStrutturaL2: varchar("descrizione_struttura_l2"),
  codiceStrutturaL3: varchar("codice_struttura_l3"),
  descrizioneStrutturaL3: varchar("descrizione_struttura_l3"),
  // Centro di Costo
  codiceCdc: varchar("codice_cdc"),
  descrizioneCdc: varchar("descrizione_cdc"),
  // Suddivisioni organizzative
  area: varchar("area"),
  sottoArea: varchar("sotto_area"),
  unitaOrganizzativa: varchar("unita_organizzativa"),
  // Sede di lavoro
  sedeId: varchar("sede_id").references(() => sedi.id),
  dataDecorrenzaSede: timestamp("data_decorrenza_sede"),
  // Altri campi
  sindacato: varchar("sindacato", { length: 100 }),
  configurazioneOrarioId: varchar("configurazione_orario_id").references(() => configurazioniOrario.id),
  configurazioneTimbraFirmaId: varchar("configurazione_timbra_firma_id").references(() => configurazioniOrario.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_organizzazione_sede").on(table.sedeId).where(sql`${table.sedeId} IS NOT NULL`),
]);

export const insertOrganizzazioneSchema = createInsertSchema(organizzazione).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrganizzazione = z.infer<typeof insertOrganizzazioneSchema>;
export type Organizzazione = typeof organizzazione.$inferSelect;

// Contratti - Informazioni Contrattuali
export const contratti = pgTable("contratti", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codiceFiscale: varchar("codice_fiscale", { length: 16 }).notNull().references(() => persona.codiceFiscale, { onDelete: "cascade" }),
  matricola: varchar("matricola", { length: 50 }), // Riferimento a persona.matricola
  // Date contrattuali
  dataAssunzione: timestamp("data_assunzione"),
  dataAssunzioneGruppo: timestamp("data_assunzione_gruppo"),
  dataFineRapporto: timestamp("data_fine_rapporto"),
  dataCessazione: timestamp("data_cessazione"),
  dataScadenzaPosizioneLavorativa: timestamp("data_scadenza_posizione_lavorativa"),
  dataScadenzaContrattoTermine: timestamp("data_scadenza_contratto_termine"),
  // Tipologia contratto
  codiceContratto: varchar("codice_contratto"),
  descrizioneContratto: varchar("descrizione_contratto"),
  tipologiaContrattoTermine: varchar("tipologia_contratto_termine"),
  causaleAssunzioneId: varchar("causale_assunzione_id").references(() => causaliAssunzione.id),
  // Classificazione
  qualifica: varchar("qualifica"),
  livello: varchar("livello"),
  jobTitle: varchar("job_title"),
  ccnlId: varchar("ccnl_id").references(() => ccnl.id),
  livelloContrattualeId: varchar("livello_contrattuale_id").references(() => livelliContrattuali.id),
  // Part-time
  partTimeCodice: varchar("part_time_codice"),
  partTimePercentuale: integer("part_time_percentuale"),
  descrizionePartTime: varchar("descrizione_part_time", { length: 255 }),
  partTimeDataInizio: timestamp("part_time_data_inizio"),
  partTimeDataFine: timestamp("part_time_data_fine"),
  // Categoria protetta
  categoriaProtettaId: varchar("categoria_protetta_id").references(() => categorieProtette.id),
  // Altri
  aziendaProvenienza: varchar("azienda_provenienza", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_contratti_matricola").on(table.matricola),
  index("idx_contratti_ccnl").on(table.ccnlId),
  index("idx_contratti_livello").on(table.livelloContrattualeId),
  index("idx_contratti_ccnl_livello").on(table.ccnlId, table.livelloContrattualeId).where(sql`${table.isActive} = true`),
  index("idx_contratti_categoria_protetta").on(table.categoriaProtettaId).where(sql`${table.categoriaProtettaId} IS NOT NULL`),
]);

export const insertContrattiSchema = createInsertSchema(contratti).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContratti = z.infer<typeof insertContrattiSchema>;
export type Contratti = typeof contratti.$inferSelect;

// Compensation - Retribuzione e MBO
export const compensation = pgTable("compensation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codiceFiscale: varchar("codice_fiscale", { length: 16 }).notNull().references(() => persona.codiceFiscale, { onDelete: "cascade" }),
  // Retribuzione
  ral: numeric("ral", { precision: 12, scale: 2 }),
  valuta: varchar("valuta", { length: 3 }).default("EUR"),
  // MBO
  mboPercentuale: integer("mbo_percentuale"), // 0-100, multipli di 5
  mboTargetEuro: numeric("mbo_target_euro", { precision: 12, scale: 2 }),
  // Periodo di validità
  validoDa: timestamp("valido_da").notNull(),
  validoA: timestamp("valido_a"),
  isCurrent: boolean("is_current").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompensationSchema = createInsertSchema(compensation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  ral: z.coerce.number().nullable().optional(),
  mboPercentuale: z.number().int().min(0).max(100).refine((val) => val % 5 === 0, {
    message: "MBO percentage must be a multiple of 5%",
  }).optional(),
});

export type InsertCompensation = z.infer<typeof insertCompensationSchema>;
export type Compensation = typeof compensation.$inferSelect;

// Ruoli - Ruoli e Responsabilità
export const ruoli = pgTable("ruoli", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codiceFiscale: varchar("codice_fiscale", { length: 16 }).notNull().unique().references(() => persona.codiceFiscale, { onDelete: "cascade" }),
  // Gerarchia
  primoResponsabileCf: varchar("primo_responsabile_cf", { length: 16 }).references(() => persona.codiceFiscale, { onDelete: "set null" }),
  responsabileDirettoCf: varchar("responsabile_diretto_cf", { length: 16 }).references(() => persona.codiceFiscale, { onDelete: "set null" }),
  reportsToCf: varchar("reports_to_cf", { length: 16 }).references(() => persona.codiceFiscale, { onDelete: "set null" }),
  // Ruoli speciali
  isTns: boolean("is_tns").default(false),
  isSgsl: boolean("is_sgsl").default(false),
  isPrivacy: boolean("is_privacy").default(false),
  // Sistema
  role: varchar("role").notNull().default("employee"),
  profileImageUrl: varchar("profile_image_url"),
  mboRegulationAcceptedAt: timestamp("mbo_regulation_accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ruoli_hierarchy").on(table.responsabileDirettoCf, table.codiceFiscale).where(sql`${table.responsabileDirettoCf} IS NOT NULL`),
]);

export const insertRuoliSchema = createInsertSchema(ruoli).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRuoli = z.infer<typeof insertRuoliSchema>;
export type Ruoli = typeof ruoli.$inferSelect;

// ==============================================
// ANAGRAFICA LOOKUP TABLES
// ==============================================

// Sedi - Anagrafica Sedi di Lavoro
export const sedi = pgTable("sedi", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codiceSede: varchar("codice_sede", { length: 50 }).unique().notNull(),
  descrizioneSede: varchar("descrizione_sede", { length: 255 }).notNull(),
  comune: varchar("comune", { length: 100 }),
  indirizzo: text("indirizzo"),
  cap: varchar("cap", { length: 10 }),
  provincia: varchar("provincia", { length: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSediSchema = createInsertSchema(sedi).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSedi = z.infer<typeof insertSediSchema>;
export type Sedi = typeof sedi.$inferSelect;

// CCNL - Contratti Collettivi Nazionali Lavoro
export const ccnl = pgTable("ccnl", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codiceCcnl: varchar("codice_ccnl", { length: 50 }).unique().notNull(),
  descrizioneCcnl: varchar("descrizione_ccnl", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCcnlSchema = createInsertSchema(ccnl).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCcnl = z.infer<typeof insertCcnlSchema>;
export type Ccnl = typeof ccnl.$inferSelect;

// Livelli Contrattuali - Livelli per CCNL
export const livelliContrattuali = pgTable("livelli_contrattuali", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ccnlId: varchar("ccnl_id").notNull().references(() => ccnl.id, { onDelete: "cascade" }),
  codiceLivello: varchar("codice_livello", { length: 50 }).notNull(),
  descrizioneLivello: varchar("descrizione_livello", { length: 255 }).notNull(),
  ordinamento: integer("ordinamento").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueCcnlLivello: uniqueIndex("unique_ccnl_livello").on(table.ccnlId, table.codiceLivello),
}));

export const insertLivelliContrattualiSchema = createInsertSchema(livelliContrattuali).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLivelliContrattuali = z.infer<typeof insertLivelliContrattualiSchema>;
export type LivelliContrattuali = typeof livelliContrattuali.$inferSelect;

// Categorie Protette - Categorie L.68/99
export const categorieProtette = pgTable("categorie_protette", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codice: varchar("codice", { length: 50 }).unique().notNull(),
  descrizione: varchar("descrizione", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCategorieProtetteSchema = createInsertSchema(categorieProtette).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCategorieProtette = z.infer<typeof insertCategorieProtetteSchema>;
export type CategorieProtette = typeof categorieProtette.$inferSelect;

// Configurazioni Orario - Tipologie Orario e Timbratura
export const configurazioniOrario = pgTable("configurazioni_orario", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codice: varchar("codice", { length: 50 }).unique().notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // "tipo_orario" o "timbra_firma"
  descrizione: varchar("descrizione", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConfigurazioniOrarioSchema = createInsertSchema(configurazioniOrario).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tipo: z.enum(["tipo_orario", "timbra_firma"]),
});

export type InsertConfigurazioniOrario = z.infer<typeof insertConfigurazioniOrarioSchema>;
export type ConfigurazioniOrario = typeof configurazioniOrario.$inferSelect;

// Causali Assunzione
export const causaliAssunzione = pgTable("causali_assunzione", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codice: varchar("codice", { length: 50 }).unique().notNull(),
  descrizione: text("descrizione").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCausaliAssunzioneSchema = createInsertSchema(causaliAssunzione).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCausaliAssunzione = z.infer<typeof insertCausaliAssunzioneSchema>;
export type CausaliAssunzione = typeof causaliAssunzione.$inferSelect;

// Smart Working Storico - Storico Smart Working
export const smartWorkingStorico = pgTable("smart_working_storico", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codiceFiscale: varchar("codice_fiscale", { length: 16 }).notNull().references(() => persona.codiceFiscale, { onDelete: "cascade" }),
  tipologiaSmartWorking: varchar("tipologia_smart_working", { length: 100 }).notNull(),
  dataDecorrenza: timestamp("data_decorrenza").notNull(),
  dataScadenza: timestamp("data_scadenza"),
  isCurrent: boolean("is_current").notNull().default(true),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_sw_storico_cf").on(table.codiceFiscale),
  index("idx_sw_storico_current").on(table.codiceFiscale, table.isCurrent).where(sql`${table.isCurrent} = true`),
]);

export const insertSmartWorkingStoricoSchema = createInsertSchema(smartWorkingStorico).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSmartWorkingStorico = z.infer<typeof insertSmartWorkingStoricoSchema>;
export type SmartWorkingStorico = typeof smartWorkingStorico.$inferSelect;

// Livelli Contrattuali Storico - Storico Cambi Livello
export const livelliContrattualiStorico = pgTable("livelli_contrattuali_storico", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contrattoId: varchar("contratto_id").notNull().references(() => contratti.id, { onDelete: "cascade" }),
  livelloContrattualeId: varchar("livello_contrattuale_id").references(() => livelliContrattuali.id),
  dataDecorrenza: timestamp("data_decorrenza").notNull(),
  dataFine: timestamp("data_fine"),
  isCurrent: boolean("is_current").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_livelli_storico_contratto").on(table.contrattoId),
  index("idx_livelli_storico_current").on(table.contrattoId, table.isCurrent).where(sql`${table.isCurrent} = true`),
]);

export const insertLivelliContrattualiStoricoSchema = createInsertSchema(livelliContrattualiStorico).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLivelliContrattualiStorico = z.infer<typeof insertLivelliContrattualiStoricoSchema>;
export type LivelliContrattualiStorico = typeof livelliContrattualiStorico.$inferSelect;

// Indicator Clusters for objectives
export const indicatorClusters = pgTable("indicator_clusters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // Obiettivi di Gruppo, Individuali, ESG, etc.
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIndicatorClusterSchema = createInsertSchema(indicatorClusters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIndicatorCluster = z.infer<typeof insertIndicatorClusterSchema>;
export type IndicatorCluster = typeof indicatorClusters.$inferSelect;

// Calculation types for objectives
export const calculationTypes = pgTable("calculation_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // Linear interpolation, 100% at target, Inverse linear, etc.
  description: text("description"),
  formula: text("formula"), // Description of calculation logic
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCalculationTypeSchema = createInsertSchema(calculationTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCalculationType = z.infer<typeof insertCalculationTypeSchema>;
export type CalculationType = typeof calculationTypes.$inferSelect;

// Business Functions (Strutture) - for objective verification source
export const businessFunctions = pgTable("business_functions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // Department/function name
  description: text("description"),
  primoLivelloId: varchar("primo_livello_id"), // Reference to first level structure
  secondoLivelloId: varchar("secondo_livello_id"), // Reference to second level structure
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBusinessFunctionSchema = createInsertSchema(businessFunctions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBusinessFunction = z.infer<typeof insertBusinessFunctionSchema>;
export type BusinessFunction = typeof businessFunctions.$inferSelect;

// Objectives Dictionary - Repository of all possible objectives
export const objectivesDictionary = pgTable("objectives_dictionary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  indicatorClusterId: varchar("indicator_cluster_id").notNull().references(() => indicatorClusters.id, { onDelete: "cascade" }),
  calculationTypeId: varchar("calculation_type_id").notNull().references(() => calculationTypes.id, { onDelete: "restrict" }),
  objectiveType: varchar("objective_type").notNull().default("numeric"), // "numeric" or "qualitative"
  targetValue: numeric("target_value", { precision: 15, scale: 2 }), // Target for numeric objectives
  thresholdValue: numeric("threshold_value", { precision: 15, scale: 2 }), // Threshold below which numeric objective is 0%
  actualValue: numeric("actual_value", { precision: 15, scale: 2 }), // Actual value reported (for numeric objectives)
  qualitativeResult: varchar("qualitative_result"), // "reached", "partial", "not_reached"
  reportedAt: timestamp("reported_at"), // When the objective was reported
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertObjectivesDictionarySchema = createInsertSchema(objectivesDictionary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  objectiveType: z.enum(["numeric", "qualitative"]).default("numeric"),
  targetValue: z.coerce.number().nullable().optional(),
  thresholdValue: z.coerce.number().nullable().optional(),
});

export type InsertObjectivesDictionary = z.infer<typeof insertObjectivesDictionarySchema>;
export type ObjectivesDictionary = typeof objectivesDictionary.$inferSelect;

// Objectives - Instances assigned to users
export const objectives = pgTable("objectives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dictionaryId: varchar("dictionary_id").notNull().references(() => objectivesDictionary.id, { onDelete: "restrict" }),
  clusterId: varchar("cluster_id").notNull().references(() => indicatorClusters.id, { onDelete: "cascade" }),
  deadline: timestamp("deadline"),
  // Reporting fields
  actualValue: numeric("actual_value", { precision: 15, scale: 2 }), // Reported value for numeric objectives
  qualitativeResult: varchar("qualitative_result"), // "reached" or "not_reached" for qualitative objectives
  reportedAt: timestamp("reported_at"), // When the reporting was done
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertObjectiveSchema = createInsertSchema(objectives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reportedAt: true,
}).extend({
  actualValue: z.coerce.number().nullable().optional(),
  qualitativeResult: z.enum(["reached", "not_reached"]).nullable().optional(),
});

export type InsertObjective = z.infer<typeof insertObjectiveSchema>;
export type Objective = typeof objectives.$inferSelect;

// Objective Assignments (linking users to objectives with weight)
export const objectiveAssignments = pgTable("objective_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  objectiveId: varchar("objective_id").notNull().references(() => objectives.id, { onDelete: "cascade" }),
  weight: integer("weight"), // Weight for this assignment (defined at assignment time, multiples of 5%)
  status: varchar("status").notNull().default("assegnato"), // assegnato, in_corso, completato, da_approvare
  progress: integer("progress").notNull().default(0), // 0-100
  assignedAt: timestamp("assigned_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserObjective: uniqueIndex("unique_user_objective").on(table.userId, table.objectiveId),
}));

export const insertObjectiveAssignmentSchema = createInsertSchema(objectiveAssignments).omit({
  id: true,
  assignedAt: true,
  updatedAt: true,
}).extend({
  weight: z.number().int().min(0).max(100).refine((val) => val % 5 === 0, {
    message: "Weight must be a multiple of 5%",
  }).optional(),
});

export type InsertObjectiveAssignment = z.infer<typeof insertObjectiveAssignmentSchema>;
export type ObjectiveAssignment = typeof objectiveAssignments.$inferSelect;

// Documents
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // regulation, policy, contract
  filePath: varchar("file_path"),
  requiresAcceptance: boolean("requires_acceptance").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Document Acceptances
export const documentAcceptances = pgTable("document_acceptances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  acceptedAt: timestamp("accepted_at").defaultNow(),
}, (table) => ({
  uniqueUserDocument: uniqueIndex("unique_user_document").on(table.userId, table.documentId),
}));

export const insertDocumentAcceptanceSchema = createInsertSchema(documentAcceptances).omit({
  id: true,
  acceptedAt: true,
});

export type InsertDocumentAcceptance = z.infer<typeof insertDocumentAcceptanceSchema>;
export type DocumentAcceptance = typeof documentAcceptances.$inferSelect;

// MBO Regulation Acceptances
export const mboRegulationAcceptances = pgTable("mbo_regulation_acceptances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  acceptedAt: timestamp("accepted_at").defaultNow(),
}, (table) => ({
  uniqueUserAcceptance: uniqueIndex("unique_mbo_user_acceptance").on(table.userId),
}));

export const insertMboRegulationAcceptanceSchema = createInsertSchema(mboRegulationAcceptances).omit({
  id: true,
  acceptedAt: true,
});

export type InsertMboRegulationAcceptance = z.infer<typeof insertMboRegulationAcceptanceSchema>;
export type MboRegulationAcceptance = typeof mboRegulationAcceptances.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  objectiveAssignments: many(objectiveAssignments),
  documentAcceptances: many(documentAcceptances),
  mboRegulationAcceptances: many(mboRegulationAcceptances),
}));

export const indicatorClustersRelations = relations(indicatorClusters, ({ many }) => ({
  objectivesDictionary: many(objectivesDictionary),
}));

export const calculationTypesRelations = relations(calculationTypes, ({ many }) => ({
  objectivesDictionary: many(objectivesDictionary),
}));

export const objectivesDictionaryRelations = relations(objectivesDictionary, ({ one, many }) => ({
  indicatorCluster: one(indicatorClusters, {
    fields: [objectivesDictionary.indicatorClusterId],
    references: [indicatorClusters.id],
  }),
  calculationType: one(calculationTypes, {
    fields: [objectivesDictionary.calculationTypeId],
    references: [calculationTypes.id],
  }),
  objectives: many(objectives),
}));

export const objectivesRelations = relations(objectives, ({ one, many }) => ({
  dictionary: one(objectivesDictionary, {
    fields: [objectives.dictionaryId],
    references: [objectivesDictionary.id],
  }),
  assignments: many(objectiveAssignments),
}));

export const objectiveAssignmentsRelations = relations(objectiveAssignments, ({ one }) => ({
  user: one(users, {
    fields: [objectiveAssignments.userId],
    references: [users.id],
  }),
  objective: one(objectives, {
    fields: [objectiveAssignments.objectiveId],
    references: [objectives.id],
  }),
}));

export const documentsRelations = relations(documents, ({ many }) => ({
  acceptances: many(documentAcceptances),
}));

export const documentAcceptancesRelations = relations(documentAcceptances, ({ one }) => ({
  user: one(users, {
    fields: [documentAcceptances.userId],
    references: [users.id],
  }),
  document: one(documents, {
    fields: [documentAcceptances.documentId],
    references: [documents.id],
  }),
}));

export const mboRegulationAcceptancesRelations = relations(mboRegulationAcceptances, ({ one }) => ({
  user: one(users, {
    fields: [mboRegulationAcceptances.userId],
    references: [users.id],
  }),
}));

// Relations for normalized tables
export const personaRelations = relations(persona, ({ one, many }) => ({
  contatti: one(contatti, {
    fields: [persona.codiceFiscale],
    references: [contatti.codiceFiscale],
  }),
  organizzazione: one(organizzazione, {
    fields: [persona.codiceFiscale],
    references: [organizzazione.codiceFiscale],
  }),
  contratti: many(contratti),
  compensation: many(compensation),
  ruoli: one(ruoli, {
    fields: [persona.codiceFiscale],
    references: [ruoli.codiceFiscale],
  }),
  smartWorkingStorico: many(smartWorkingStorico),
}));

export const contattiRelations = relations(contatti, ({ one }) => ({
  persona: one(persona, {
    fields: [contatti.codiceFiscale],
    references: [persona.codiceFiscale],
  }),
}));

export const organizzazioneRelations = relations(organizzazione, ({ one }) => ({
  persona: one(persona, {
    fields: [organizzazione.codiceFiscale],
    references: [persona.codiceFiscale],
  }),
  sede: one(sedi, {
    fields: [organizzazione.sedeId],
    references: [sedi.id],
  }),
  configurazioneOrario: one(configurazioniOrario, {
    fields: [organizzazione.configurazioneOrarioId],
    references: [configurazioniOrario.id],
    relationName: "configurazione_orario",
  }),
  configurazioneTimbraFirma: one(configurazioniOrario, {
    fields: [organizzazione.configurazioneTimbraFirmaId],
    references: [configurazioniOrario.id],
    relationName: "configurazione_timbra",
  }),
}));

export const contrattiRelations = relations(contratti, ({ one, many }) => ({
  persona: one(persona, {
    fields: [contratti.codiceFiscale],
    references: [persona.codiceFiscale],
  }),
  ccnl: one(ccnl, {
    fields: [contratti.ccnlId],
    references: [ccnl.id],
  }),
  livelloContrattuale: one(livelliContrattuali, {
    fields: [contratti.livelloContrattualeId],
    references: [livelliContrattuali.id],
  }),
  causaleAssunzione: one(causaliAssunzione, {
    fields: [contratti.causaleAssunzioneId],
    references: [causaliAssunzione.id],
  }),
  categoriaProtetta: one(categorieProtette, {
    fields: [contratti.categoriaProtettaId],
    references: [categorieProtette.id],
  }),
  livelliStorico: many(livelliContrattualiStorico),
}));

export const compensationRelations = relations(compensation, ({ one }) => ({
  persona: one(persona, {
    fields: [compensation.codiceFiscale],
    references: [persona.codiceFiscale],
  }),
}));

export const ruoliRelations = relations(ruoli, ({ one }) => ({
  persona: one(persona, {
    fields: [ruoli.codiceFiscale],
    references: [persona.codiceFiscale],
  }),
  primoResponsabile: one(persona, {
    fields: [ruoli.primoResponsabileCf],
    references: [persona.codiceFiscale],
  }),
  responsabileDiretto: one(persona, {
    fields: [ruoli.responsabileDirettoCf],
    references: [persona.codiceFiscale],
  }),
  reportsTo: one(persona, {
    fields: [ruoli.reportsToCf],
    references: [persona.codiceFiscale],
  }),
}));

// ==============================================
// ANAGRAFICA LOOKUP TABLES RELATIONS
// ==============================================

export const sediRelations = relations(sedi, ({ many }) => ({
  organizzazioni: many(organizzazione),
}));

export const ccnlRelations = relations(ccnl, ({ many }) => ({
  livelli: many(livelliContrattuali),
  contratti: many(contratti),
}));

export const livelliContrattualiRelations = relations(livelliContrattuali, ({ one, many }) => ({
  ccnl: one(ccnl, {
    fields: [livelliContrattuali.ccnlId],
    references: [ccnl.id],
  }),
  contratti: many(contratti),
  storico: many(livelliContrattualiStorico),
}));

export const categorieProtetteRelations = relations(categorieProtette, ({ many }) => ({
  contratti: many(contratti),
}));

export const configurazioniOrarioRelations = relations(configurazioniOrario, ({ many }) => ({
  organizzazioniOrario: many(organizzazione, { relationName: "configurazione_orario" }),
  organizzazioniTimbra: many(organizzazione, { relationName: "configurazione_timbra" }),
}));

export const causaliAssunzioneRelations = relations(causaliAssunzione, ({ many }) => ({
  contratti: many(contratti),
}));

export const smartWorkingStoricoRelations = relations(smartWorkingStorico, ({ one }) => ({
  persona: one(persona, {
    fields: [smartWorkingStorico.codiceFiscale],
    references: [persona.codiceFiscale],
  }),
}));

export const livelliContrattualiStoricoRelations = relations(livelliContrattualiStorico, ({ one }) => ({
  contratto: one(contratti, {
    fields: [livelliContrattualiStorico.contrattoId],
    references: [contratti.id],
  }),
  livelloContrattuale: one(livelliContrattuali, {
    fields: [livelliContrattualiStorico.livelloContrattualeId],
    references: [livelliContrattuali.id],
  }),
}));

// ==============================================
// CUSTOM FIELDS SYSTEM
// ==============================================

// Custom Field Definitions - Configuration of custom fields
export const customFieldDefinitions = pgTable("custom_field_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fieldName: varchar("field_name").notNull(), // Internal name (snake_case)
  fieldLabel: varchar("field_label").notNull(), // Display label
  fieldType: varchar("field_type").notNull(), // text, number, date, select, multiselect, boolean, email, phone, url
  category: varchar("category").notNull(), // personal, contact, organizational, professional, custom
  section: varchar("section"), // Which section of the profile to display in
  isRequired: boolean("is_required").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  isSearchable: boolean("is_searchable").notNull().default(false),
  displayOrder: integer("display_order").default(0),
  placeholder: varchar("placeholder"),
  helpText: text("help_text"),
  validationRules: jsonb("validation_rules"), // JSON for min, max, pattern, etc.
  options: jsonb("options"), // For select/multiselect: [{value: "opt1", label: "Option 1"}]
  defaultValue: text("default_value"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomFieldDefinitionSchema = createInsertSchema(customFieldDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  fieldType: z.enum(["text", "number", "date", "select", "multiselect", "boolean", "email", "phone", "url", "textarea"]),
  category: z.enum(["personal", "contact", "organizational", "professional", "custom"]),
  validationRules: z.any().optional(),
  options: z.any().optional(),
});

export type InsertCustomFieldDefinition = z.infer<typeof insertCustomFieldDefinitionSchema>;
export type CustomFieldDefinition = typeof customFieldDefinitions.$inferSelect;

// Custom Field Values - Actual values for each user
export const customFieldValues = pgTable("custom_field_values", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fieldId: varchar("field_id").notNull().references(() => customFieldDefinitions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  value: text("value"), // Stored as text, parsed based on field type
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("unique_field_user").on(table.fieldId, table.userId),
]);

export const insertCustomFieldValueSchema = createInsertSchema(customFieldValues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomFieldValue = z.infer<typeof insertCustomFieldValueSchema>;
export type CustomFieldValue = typeof customFieldValues.$inferSelect;

// Relations
export const customFieldDefinitionsRelations = relations(customFieldDefinitions, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [customFieldDefinitions.createdBy],
    references: [users.id],
  }),
  values: many(customFieldValues),
}));

export const customFieldValuesRelations = relations(customFieldValues, ({ one }) => ({
  field: one(customFieldDefinitions, {
    fields: [customFieldValues.fieldId],
    references: [customFieldDefinitions.id],
  }),
  user: one(users, {
    fields: [customFieldValues.userId],
    references: [users.id],
  }),
}));

// ==============================================
// COMPETENCIES & PERFORMANCE MANAGEMENT SYSTEM
// ==============================================

// Competency Models - Templates for different personas
export const competencyModels = pgTable("competency_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "Executive Competencies", "Manager Competencies"
  description: text("description"),
  personaType: varchar("persona_type").notNull(), // "executive", "manager", "professional", "individual_contributor"
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompetencyModelSchema = createInsertSchema(competencyModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  personaType: z.enum(["executive", "manager", "professional", "individual_contributor"]),
});

export type InsertCompetencyModel = z.infer<typeof insertCompetencyModelSchema>;
export type CompetencyModel = typeof competencyModels.$inferSelect;

// User Competency Model Assignments - Associates users with competency models
export const userCompetencyModelAssignments = pgTable("user_competency_model_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  competencyModelId: varchar("competency_model_id").notNull().references(() => competencyModels.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by").references(() => users.id, { onDelete: "set null" }),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validTo: timestamp("valid_to"),
  isCurrent: boolean("is_current").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserModelCurrent: uniqueIndex("unique_user_model_current").on(table.userId, table.competencyModelId, table.isCurrent),
}));

export const insertUserCompetencyModelAssignmentSchema = createInsertSchema(userCompetencyModelAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assignedAt: true,
}).extend({
  validFrom: z.union([z.string(), z.date()]).transform(val => new Date(val)),
  validTo: z.union([z.string(), z.date(), z.null()]).transform(val => val ? new Date(val) : null).nullable().optional(),
});

export type InsertUserCompetencyModelAssignment = z.infer<typeof insertUserCompetencyModelAssignmentSchema>;
export type UserCompetencyModelAssignment = typeof userCompetencyModelAssignments.$inferSelect;

// Competencies - Individual competency definitions
export const competencies = pgTable("competencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: varchar("model_id").notNull().references(() => competencyModels.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // "Leadership", "Problem Solving", "Communication"
  description: text("description"),
  category: varchar("category"), // "technical", "behavioral", "leadership", "transversal"
  isTransversal: boolean("is_transversal").notNull().default(false), // Shared across multiple personas
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompetencySchema = createInsertSchema(competencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  category: z.enum(["technical", "behavioral", "leadership", "transversal"]).optional(),
});

export type InsertCompetency = z.infer<typeof insertCompetencySchema>;
export type Competency = typeof competencies.$inferSelect;

// Evaluation Cycles - Annual performance review cycles
export const evaluationCycles = pgTable("evaluation_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "Ciclo 2024", "Performance Review 2024"
  year: integer("year").notNull(),
  status: varchar("status").notNull().default("draft"), // "draft", "active", "completed", "archived"

  // Phase dates
  selfAssessmentStart: timestamp("self_assessment_start"),
  selfAssessmentEnd: timestamp("self_assessment_end"),
  peerFeedbackStart: timestamp("peer_feedback_start"),
  peerFeedbackEnd: timestamp("peer_feedback_end"),
  managerEvaluationStart: timestamp("manager_evaluation_start"),
  managerEvaluationEnd: timestamp("manager_evaluation_end"),
  feedbackDeliveryStart: timestamp("feedback_delivery_start"),
  feedbackDeliveryEnd: timestamp("feedback_delivery_end"),

  // Configuration
  enable360Feedback: boolean("enable_360_feedback").notNull().default(false),

  // Metadata
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEvaluationCycleSchema = createInsertSchema(evaluationCycles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["draft", "active", "completed", "archived"]).default("draft"),
  createdBy: z.string().optional(),
  // Convert date strings to Date objects, handle empty strings and null values
  selfAssessmentStart: z.union([z.string(), z.date(), z.null()]).transform(val => !val || val === '' ? null : new Date(val)).nullable().optional(),
  selfAssessmentEnd: z.union([z.string(), z.date(), z.null()]).transform(val => !val || val === '' ? null : new Date(val)).nullable().optional(),
  peerFeedbackStart: z.union([z.string(), z.date(), z.null()]).transform(val => !val || val === '' ? null : new Date(val)).nullable().optional(),
  peerFeedbackEnd: z.union([z.string(), z.date(), z.null()]).transform(val => !val || val === '' ? null : new Date(val)).nullable().optional(),
  managerEvaluationStart: z.union([z.string(), z.date(), z.null()]).transform(val => !val || val === '' ? null : new Date(val)).nullable().optional(),
  managerEvaluationEnd: z.union([z.string(), z.date(), z.null()]).transform(val => !val || val === '' ? null : new Date(val)).nullable().optional(),
  feedbackDeliveryStart: z.union([z.string(), z.date(), z.null()]).transform(val => !val || val === '' ? null : new Date(val)).nullable().optional(),
  feedbackDeliveryEnd: z.union([z.string(), z.date(), z.null()]).transform(val => !val || val === '' ? null : new Date(val)).nullable().optional(),
});

export type InsertEvaluationCycle = z.infer<typeof insertEvaluationCycleSchema>;
export type EvaluationCycle = typeof evaluationCycles.$inferSelect;

// Self Assessments - Employee self-evaluations
export const selfAssessments = pgTable("self_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  competencyId: varchar("competency_id").notNull().references(() => competencies.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment").notNull(),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueCycleUserCompetency: uniqueIndex("unique_self_assessment").on(table.cycleId, table.userId, table.competencyId),
}));

export const insertSelfAssessmentSchema = createInsertSchema(selfAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
}).extend({
  rating: z.number().int().min(1).max(5),
});

export type InsertSelfAssessment = z.infer<typeof insertSelfAssessmentSchema>;
export type SelfAssessment = typeof selfAssessments.$inferSelect;

// Overall Self Assessments - General overall evaluation for the cycle
export const overallSelfAssessments = pgTable("overall_self_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  overallRating: integer("overall_rating").notNull(), // 1-5
  overallComment: text("overall_comment").notNull(),
  strengths: text("strengths"), // Punti di forza
  areasForImprovement: text("areas_for_improvement"), // Aree di miglioramento
  goals: text("goals"), // Obiettivi futuri
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueCycleUser: uniqueIndex("unique_overall_self_assessment").on(table.cycleId, table.userId),
}));

export const insertOverallSelfAssessmentSchema = createInsertSchema(overallSelfAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
}).extend({
  overallRating: z.number().int().min(1).max(5),
  overallComment: z.string().min(1, "Overall comment cannot be empty"),
});

export type InsertOverallSelfAssessment = z.infer<typeof insertOverallSelfAssessmentSchema>;
export type OverallSelfAssessment = typeof overallSelfAssessments.$inferSelect;

// Peer Feedback Requests - 360 degree feedback requests
export const peerFeedbackRequests = pgTable("peer_feedback_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  requestorUserId: varchar("requestor_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  peerUserId: varchar("peer_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status").notNull().default("pending"), // "pending", "completed", "declined"
  requestedAt: timestamp("requested_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueCycleRequestorPeer: uniqueIndex("unique_peer_request").on(table.cycleId, table.requestorUserId, table.peerUserId),
}));

export const insertPeerFeedbackRequestSchema = createInsertSchema(peerFeedbackRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  requestedAt: true,
  completedAt: true,
}).extend({
  status: z.enum(["pending", "completed", "declined"]).default("pending"),
});

export type InsertPeerFeedbackRequest = z.infer<typeof insertPeerFeedbackRequestSchema>;
export type PeerFeedbackRequest = typeof peerFeedbackRequests.$inferSelect;

// Peer Feedbacks - Anonymous 360 feedback
export const peerFeedbacks = pgTable("peer_feedbacks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => peerFeedbackRequests.id, { onDelete: "cascade" }),
  cycleId: varchar("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  requestorUserId: varchar("requestor_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  peerUserId: varchar("peer_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  competencyId: varchar("competency_id").notNull().references(() => competencies.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueRequestCompetency: uniqueIndex("unique_peer_feedback").on(table.requestId, table.competencyId),
}));

export const insertPeerFeedbackSchema = createInsertSchema(peerFeedbacks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
}).extend({
  rating: z.number().int().min(1).max(5),
});

export type InsertPeerFeedback = z.infer<typeof insertPeerFeedbackSchema>;
export type PeerFeedback = typeof peerFeedbacks.$inferSelect;

// Manager Evaluations - Manager's evaluation of employees
export const managerEvaluations = pgTable("manager_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  employeeUserId: varchar("employee_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  managerUserId: varchar("manager_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  competencyId: varchar("competency_id").notNull().references(() => competencies.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment").notNull(),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueCycleEmployeeCompetency: uniqueIndex("unique_manager_evaluation").on(table.cycleId, table.employeeUserId, table.competencyId),
}));

export const insertManagerEvaluationSchema = createInsertSchema(managerEvaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
}).extend({
  rating: z.number().int().min(1).max(5),
});

export type InsertManagerEvaluation = z.infer<typeof insertManagerEvaluationSchema>;
export type ManagerEvaluation = typeof managerEvaluations.$inferSelect;

// Development Plans - Collaborative development plans
export const developmentPlans = pgTable("development_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  employeeUserId: varchar("employee_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  managerUserId: varchar("manager_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Competencies to develop (array of competency IDs)
  competenciesToDevelop: jsonb("competencies_to_develop"), // ["comp-id-1", "comp-id-2"]

  // Development goals
  developmentGoals: text("development_goals").notNull(),

  // Action items with deadlines and status
  actionItems: jsonb("action_items"), // [{ action: "...", deadline: "...", status: "..." }]

  // Notes
  managerNotes: text("manager_notes"),
  employeeNotes: text("employee_notes"),

  // Timeline
  feedbackSessionDate: timestamp("feedback_session_date"),
  reviewDate: timestamp("review_date"),

  status: varchar("status").notNull().default("draft"), // "draft", "agreed", "in_progress", "completed"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueCycleEmployee: uniqueIndex("unique_development_plan").on(table.cycleId, table.employeeUserId),
}));

export const insertDevelopmentPlanSchema = createInsertSchema(developmentPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["draft", "agreed", "in_progress", "completed"]).default("draft"),
  competenciesToDevelop: z.any().optional(),
  actionItems: z.any().optional(),
});

export type InsertDevelopmentPlan = z.infer<typeof insertDevelopmentPlanSchema>;
export type DevelopmentPlan = typeof developmentPlans.$inferSelect;

// Evaluation Notifications - Automated reminders and notifications
export const evaluationNotifications = pgTable("evaluation_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  notificationType: varchar("notification_type").notNull(), // "self_assessment_reminder", "peer_feedback_request", etc.
  phase: varchar("phase").notNull(), // "self_assessment", "peer_feedback", "manager_evaluation", "feedback_delivery"
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEvaluationNotificationSchema = createInsertSchema(evaluationNotifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  readAt: true,
});

export type InsertEvaluationNotification = z.infer<typeof insertEvaluationNotificationSchema>;
export type EvaluationNotification = typeof evaluationNotifications.$inferSelect;

// Relations for competency system
export const competencyModelsRelations = relations(competencyModels, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [competencyModels.createdBy],
    references: [users.id],
  }),
  competencies: many(competencies),
  userAssignments: many(userCompetencyModelAssignments),
}));

export const userCompetencyModelAssignmentsRelations = relations(userCompetencyModelAssignments, ({ one }) => ({
  user: one(users, {
    fields: [userCompetencyModelAssignments.userId],
    references: [users.id],
  }),
  competencyModel: one(competencyModels, {
    fields: [userCompetencyModelAssignments.competencyModelId],
    references: [competencyModels.id],
  }),
  assignedByUser: one(users, {
    fields: [userCompetencyModelAssignments.assignedBy],
    references: [users.id],
  }),
}));

export const competenciesRelations = relations(competencies, ({ one, many }) => ({
  model: one(competencyModels, {
    fields: [competencies.modelId],
    references: [competencyModels.id],
  }),
  selfAssessments: many(selfAssessments),
  peerFeedbacks: many(peerFeedbacks),
  managerEvaluations: many(managerEvaluations),
}));

export const evaluationCyclesRelations = relations(evaluationCycles, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [evaluationCycles.createdBy],
    references: [users.id],
  }),
  selfAssessments: many(selfAssessments),
  peerFeedbackRequests: many(peerFeedbackRequests),
  peerFeedbacks: many(peerFeedbacks),
  managerEvaluations: many(managerEvaluations),
  developmentPlans: many(developmentPlans),
  notifications: many(evaluationNotifications),
}));

export const selfAssessmentsRelations = relations(selfAssessments, ({ one }) => ({
  cycle: one(evaluationCycles, {
    fields: [selfAssessments.cycleId],
    references: [evaluationCycles.id],
  }),
  user: one(users, {
    fields: [selfAssessments.userId],
    references: [users.id],
  }),
  competency: one(competencies, {
    fields: [selfAssessments.competencyId],
    references: [competencies.id],
  }),
}));

export const overallSelfAssessmentsRelations = relations(overallSelfAssessments, ({ one }) => ({
  cycle: one(evaluationCycles, {
    fields: [overallSelfAssessments.cycleId],
    references: [evaluationCycles.id],
  }),
  user: one(users, {
    fields: [overallSelfAssessments.userId],
    references: [users.id],
  }),
}));

export const peerFeedbackRequestsRelations = relations(peerFeedbackRequests, ({ one, many }) => ({
  cycle: one(evaluationCycles, {
    fields: [peerFeedbackRequests.cycleId],
    references: [evaluationCycles.id],
  }),
  requestor: one(users, {
    fields: [peerFeedbackRequests.requestorUserId],
    references: [users.id],
  }),
  peer: one(users, {
    fields: [peerFeedbackRequests.peerUserId],
    references: [users.id],
  }),
  feedbacks: many(peerFeedbacks),
}));

export const peerFeedbacksRelations = relations(peerFeedbacks, ({ one }) => ({
  request: one(peerFeedbackRequests, {
    fields: [peerFeedbacks.requestId],
    references: [peerFeedbackRequests.id],
  }),
  cycle: one(evaluationCycles, {
    fields: [peerFeedbacks.cycleId],
    references: [evaluationCycles.id],
  }),
  requestor: one(users, {
    fields: [peerFeedbacks.requestorUserId],
    references: [users.id],
  }),
  peer: one(users, {
    fields: [peerFeedbacks.peerUserId],
    references: [users.id],
  }),
  competency: one(competencies, {
    fields: [peerFeedbacks.competencyId],
    references: [competencies.id],
  }),
}));

export const managerEvaluationsRelations = relations(managerEvaluations, ({ one }) => ({
  cycle: one(evaluationCycles, {
    fields: [managerEvaluations.cycleId],
    references: [evaluationCycles.id],
  }),
  employee: one(users, {
    fields: [managerEvaluations.employeeUserId],
    references: [users.id],
  }),
  manager: one(users, {
    fields: [managerEvaluations.managerUserId],
    references: [users.id],
  }),
  competency: one(competencies, {
    fields: [managerEvaluations.competencyId],
    references: [competencies.id],
  }),
}));

export const developmentPlansRelations = relations(developmentPlans, ({ one }) => ({
  cycle: one(evaluationCycles, {
    fields: [developmentPlans.cycleId],
    references: [evaluationCycles.id],
  }),
  employee: one(users, {
    fields: [developmentPlans.employeeUserId],
    references: [users.id],
  }),
  manager: one(users, {
    fields: [developmentPlans.managerUserId],
    references: [users.id],
  }),
}));

export const evaluationNotificationsRelations = relations(evaluationNotifications, ({ one }) => ({
  cycle: one(evaluationCycles, {
    fields: [evaluationNotifications.cycleId],
    references: [evaluationCycles.id],
  }),
  user: one(users, {
    fields: [evaluationNotifications.userId],
    references: [users.id],
  }),
}));
