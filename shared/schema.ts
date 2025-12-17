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
