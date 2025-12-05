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
  codiceFiscale: varchar("codice_fiscale"), // Tax ID
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("employee"), // employee or admin
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
});

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
  cognome: varchar("cognome").notNull(),
  nome: varchar("nome").notNull(),
  dataNascita: timestamp("data_nascita"),
  sesso: varchar("sesso", { length: 1 }), // M, F, A
  cittadinanza: varchar("cittadinanza"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  // Date contrattuali
  dataAssunzione: timestamp("data_assunzione"),
  dataFineRapporto: timestamp("data_fine_rapporto"),
  dataCessazione: timestamp("data_cessazione"),
  // Tipologia contratto
  codiceContratto: varchar("codice_contratto"),
  descrizioneContratto: varchar("descrizione_contratto"),
  tipologiaContrattoTermine: varchar("tipologia_contratto_termine"),
  // Classificazione
  qualifica: varchar("qualifica"),
  livello: varchar("livello"),
  jobTitle: varchar("job_title"),
  // Part-time
  partTimeCodice: varchar("part_time_codice"),
  partTimePercentuale: integer("part_time_percentuale"),
  partTimeDataInizio: timestamp("part_time_data_inizio"),
  partTimeDataFine: timestamp("part_time_data_fine"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
});

export const insertRuoliSchema = createInsertSchema(ruoli).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRuoli = z.infer<typeof insertRuoliSchema>;
export type Ruoli = typeof ruoli.$inferSelect;

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
}));

export const contrattiRelations = relations(contratti, ({ one }) => ({
  persona: one(persona, {
    fields: [contratti.codiceFiscale],
    references: [persona.codiceFiscale],
  }),
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
