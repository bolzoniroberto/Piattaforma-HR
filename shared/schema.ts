import { sql } from 'drizzle-orm';
import {
  index,
  text,
  sqliteTable,
  integer,
  real,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - Required for Replit Auth
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  codiceFiscale: text("codice_fiscale", { length: 16 }).unique(), // Tax ID - FK to persona
  matricola: text("matricola", { length: 50 }).unique(), // Employee code - for quick lookup
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("employee"), // employee, admin, or hr
  department: text("department"),
  cdc: text("cdc"), // Centro di Costo (Cost Center)
  managerId: text("manager_id").references((): any => users.id, { onDelete: "set null" }), // Manager/responsabile
  ral: real("ral"), // Annual salary
  mboPercentage: integer("mbo_percentage"), // MBO percentage (in multiples of 5)
  mboRegulationAcceptedAt: integer("mbo_regulation_accepted_at"), // When user accepted MBO regulation
  faqReadAt: integer("faq_read_at"), // When user last read the FAQs
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true), // Whether user is active
  beneficiaryType: text("beneficiary_type").notNull().default("standard"), // MBO beneficiary type: standard, DIRS, CEO
  hireDate: text("hire_date"), // ISO date of hire in current MBO year (for pro-rata alerts)
  isRendicontatore: integer("is_rendicontatore", { mode: "boolean" }).notNull().default(false), // Can report actuals centrally
  telefono: text("telefono"), // Phone number
  indirizzo: text("indirizzo"), // Address
  cap: text("cap", { length: 10 }), // Postal code
  citta: text("citta"), // City
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
  matricola: true,
  role: true,
  profileImageUrl: true,
  department: true,
  cdc: true,
  managerId: true,
  ral: true,
  mboPercentage: true,
  mboRegulationAcceptedAt: true,
  faqReadAt: true,
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
  beneficiaryType: z.enum(["standard", "DIRS", "CEO"]).optional(),
  hireDate: z.string().nullable().optional(),
  isRendicontatore: z.boolean().optional(),
  faqReadAt: z.number().nullable().optional(),
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// ==============================================
// NORMALIZED USER TABLES
// ==============================================

// Persona - Dati Anagrafici Base
export const persona = sqliteTable("persona", {
  codiceFiscale: text("codice_fiscale", { length: 16 }).primaryKey(),
  matricola: text("matricola", { length: 50 }).unique(),
  cognome: text("cognome").notNull(),
  nome: text("nome").notNull(),
  dataNascita: integer("data_nascita"),
  sesso: text("sesso", { length: 1 }), // M, F, A
  cittadinanza: text("cittadinanza"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const contatti = sqliteTable("contatti", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  codiceFiscale: text("codice_fiscale", { length: 16 }).notNull().unique().references(() => persona.codiceFiscale, { onDelete: "cascade" }),
  email: text("email").unique().notNull(),
  telefono: text("telefono"),
  indirizzo: text("indirizzo"),
  cap: text("cap", { length: 10 }),
  citta: text("citta"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const insertContattiSchema = createInsertSchema(contatti).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContatti = z.infer<typeof insertContattiSchema>;
export type Contatti = typeof contatti.$inferSelect;

// Organizzazione - Struttura Aziendale
export const organizzazione = sqliteTable("organizzazione", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  codiceFiscale: text("codice_fiscale", { length: 16 }).notNull().unique().references(() => persona.codiceFiscale, { onDelete: "cascade" }),
  codiceAzienda: text("codice_azienda"),
  azienda: text("azienda"),
  // Gerarchia strutturale (3 livelli)
  codiceStrutturaL1: text("codice_struttura_l1"),
  descrizioneStrutturaL1: text("descrizione_struttura_l1"),
  codiceStrutturaL2: text("codice_struttura_l2"),
  descrizioneStrutturaL2: text("descrizione_struttura_l2"),
  codiceStrutturaL3: text("codice_struttura_l3"),
  descrizioneStrutturaL3: text("descrizione_struttura_l3"),
  // Centro di Costo
  codiceCdc: text("codice_cdc"),
  descrizioneCdc: text("descrizione_cdc"),
  // Suddivisioni organizzative
  area: text("area"),
  sottoArea: text("sotto_area"),
  unitaOrganizzativa: text("unita_organizzativa"),
  // Sede di lavoro
  sedeId: text("sede_id").references(() => sedi.id),
  dataDecorrenzaSede: integer("data_decorrenza_sede"),
  // Altri campi
  sindacato: text("sindacato", { length: 100 }),
  configurazioneOrarioId: text("configurazione_orario_id").references(() => configurazioniOrario.id),
  configurazioneTimbraFirmaId: text("configurazione_timbra_firma_id").references(() => configurazioniOrario.id),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const contratti = sqliteTable("contratti", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  codiceFiscale: text("codice_fiscale", { length: 16 }).notNull().references(() => persona.codiceFiscale, { onDelete: "cascade" }),
  matricola: text("matricola", { length: 50 }), // Riferimento a persona.matricola
  // Date contrattuali
  dataAssunzione: integer("data_assunzione"),
  dataAssunzioneGruppo: integer("data_assunzione_gruppo"),
  dataFineRapporto: integer("data_fine_rapporto"),
  dataCessazione: integer("data_cessazione"),
  dataScadenzaPosizioneLavorativa: integer("data_scadenza_posizione_lavorativa"),
  dataScadenzaContrattoTermine: integer("data_scadenza_contratto_termine"),
  // Tipologia contratto
  codiceContratto: text("codice_contratto"),
  descrizioneContratto: text("descrizione_contratto"),
  tipologiaContrattoTermine: text("tipologia_contratto_termine"),
  causaleAssunzioneId: text("causale_assunzione_id").references(() => causaliAssunzione.id),
  // Classificazione
  qualifica: text("qualifica"),
  livello: text("livello"),
  jobTitle: text("job_title"),
  ccnlId: text("ccnl_id").references(() => ccnl.id),
  livelloContrattualeId: text("livello_contrattuale_id").references(() => livelliContrattuali.id),
  // Part-time
  partTimeCodice: text("part_time_codice"),
  partTimePercentuale: integer("part_time_percentuale"),
  descrizionePartTime: text("descrizione_part_time", { length: 255 }),
  partTimeDataInizio: integer("part_time_data_inizio"),
  partTimeDataFine: integer("part_time_data_fine"),
  // Categoria protetta
  categoriaProtettaId: text("categoria_protetta_id").references(() => categorieProtette.id),
  // Altri
  aziendaProvenienza: text("azienda_provenienza", { length: 255 }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const compensation = sqliteTable("compensation", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  codiceFiscale: text("codice_fiscale", { length: 16 }).notNull().references(() => persona.codiceFiscale, { onDelete: "cascade" }),
  // Retribuzione
  ral: real("ral"),
  valuta: text("valuta", { length: 3 }).default("EUR"),
  // MBO
  mboPercentuale: integer("mbo_percentuale"), // 0-100, multipli di 5
  mboTargetEuro: real("mbo_target_euro"),
  // Periodo di validità
  validoDa: integer("valido_da").notNull(),
  validoA: integer("valido_a"),
  isCurrent: integer("is_current", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const ruoli = sqliteTable("ruoli", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  codiceFiscale: text("codice_fiscale", { length: 16 }).notNull().unique().references(() => persona.codiceFiscale, { onDelete: "cascade" }),
  // Gerarchia
  primoResponsabileCf: text("primo_responsabile_cf", { length: 16 }).references(() => persona.codiceFiscale, { onDelete: "set null" }),
  responsabileDirettoCf: text("responsabile_diretto_cf", { length: 16 }).references(() => persona.codiceFiscale, { onDelete: "set null" }),
  reportsToCf: text("reports_to_cf", { length: 16 }).references(() => persona.codiceFiscale, { onDelete: "set null" }),
  // Ruoli speciali
  isTns: integer("is_tns", { mode: "boolean" }).default(false),
  isSgsl: integer("is_sgsl", { mode: "boolean" }).default(false),
  isPrivacy: integer("is_privacy", { mode: "boolean" }).default(false),
  // Sistema
  role: text("role").notNull().default("employee"),
  profileImageUrl: text("profile_image_url"),
  mboRegulationAcceptedAt: integer("mbo_regulation_accepted_at"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const sedi = sqliteTable("sedi", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  codiceSede: text("codice_sede", { length: 50 }).unique().notNull(),
  descrizioneSede: text("descrizione_sede", { length: 255 }).notNull(),
  comune: text("comune", { length: 100 }),
  indirizzo: text("indirizzo"),
  cap: text("cap", { length: 10 }),
  provincia: text("provincia", { length: 2 }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const insertSediSchema = createInsertSchema(sedi).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSedi = z.infer<typeof insertSediSchema>;
export type Sedi = typeof sedi.$inferSelect;

// CCNL - Contratti Collettivi Nazionali Lavoro
export const ccnl = sqliteTable("ccnl", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  codiceCcnl: text("codice_ccnl", { length: 50 }).unique().notNull(),
  descrizioneCcnl: text("descrizione_ccnl", { length: 255 }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const insertCcnlSchema = createInsertSchema(ccnl).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCcnl = z.infer<typeof insertCcnlSchema>;
export type Ccnl = typeof ccnl.$inferSelect;

// Livelli Contrattuali - Livelli per CCNL
export const livelliContrattuali = sqliteTable("livelli_contrattuali", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  ccnlId: text("ccnl_id").notNull().references(() => ccnl.id, { onDelete: "cascade" }),
  codiceLivello: text("codice_livello", { length: 50 }).notNull(),
  descrizioneLivello: text("descrizione_livello", { length: 255 }).notNull(),
  ordinamento: integer("ordinamento").default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const categorieProtette = sqliteTable("categorie_protette", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  codice: text("codice", { length: 50 }).unique().notNull(),
  descrizione: text("descrizione", { length: 255 }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const insertCategorieProtetteSchema = createInsertSchema(categorieProtette).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCategorieProtette = z.infer<typeof insertCategorieProtetteSchema>;
export type CategorieProtette = typeof categorieProtette.$inferSelect;

// Configurazioni Orario - Tipologie Orario e Timbratura
export const configurazioniOrario = sqliteTable("configurazioni_orario", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  codice: text("codice", { length: 50 }).unique().notNull(),
  tipo: text("tipo", { length: 50 }).notNull(), // "tipo_orario" o "timbra_firma"
  descrizione: text("descrizione", { length: 255 }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const causaliAssunzione = sqliteTable("causali_assunzione", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  codice: text("codice", { length: 50 }).unique().notNull(),
  descrizione: text("descrizione").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const insertCausaliAssunzioneSchema = createInsertSchema(causaliAssunzione).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCausaliAssunzione = z.infer<typeof insertCausaliAssunzioneSchema>;
export type CausaliAssunzione = typeof causaliAssunzione.$inferSelect;

// Smart Working Storico - Storico Smart Working
export const smartWorkingStorico = sqliteTable("smart_working_storico", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  codiceFiscale: text("codice_fiscale", { length: 16 }).notNull().references(() => persona.codiceFiscale, { onDelete: "cascade" }),
  tipologiaSmartWorking: text("tipologia_smart_working", { length: 100 }).notNull(),
  dataDecorrenza: integer("data_decorrenza").notNull(),
  dataScadenza: integer("data_scadenza"),
  isCurrent: integer("is_current", { mode: "boolean" }).notNull().default(true),
  note: text("note"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const livelliContrattualiStorico = sqliteTable("livelli_contrattuali_storico", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  contrattoId: text("contratto_id").notNull().references(() => contratti.id, { onDelete: "cascade" }),
  livelloContrattualeId: text("livello_contrattuale_id").references(() => livelliContrattuali.id),
  dataDecorrenza: integer("data_decorrenza").notNull(),
  dataFine: integer("data_fine"),
  isCurrent: integer("is_current", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const indicatorClusters = sqliteTable("indicator_clusters", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  name: text("name").notNull(), // Obiettivi di Gruppo, Individuali, ESG, etc.
  description: text("description"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const insertIndicatorClusterSchema = createInsertSchema(indicatorClusters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIndicatorCluster = z.infer<typeof insertIndicatorClusterSchema>;
export type IndicatorCluster = typeof indicatorClusters.$inferSelect;

// Calculation types for objectives
export const calculationTypes = sqliteTable("calculation_types", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  name: text("name").notNull(), // Linear interpolation, 100% at target, Inverse linear, etc.
  description: text("description"),
  formula: text("formula"), // Description of calculation logic
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const insertCalculationTypeSchema = createInsertSchema(calculationTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCalculationType = z.infer<typeof insertCalculationTypeSchema>;
export type CalculationType = typeof calculationTypes.$inferSelect;

// Business Functions (Strutture) - for objective verification source
export const businessFunctions = sqliteTable("business_functions", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  name: text("name").notNull(), // Department/function name
  description: text("description"),
  primoLivelloId: text("primo_livello_id"), // Reference to first level structure
  secondoLivelloId: text("secondo_livello_id"), // Reference to second level structure
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const insertBusinessFunctionSchema = createInsertSchema(businessFunctions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBusinessFunction = z.infer<typeof insertBusinessFunctionSchema>;
export type BusinessFunction = typeof businessFunctions.$inferSelect;

// Objectives Dictionary - Repository of all possible objectives
export const objectivesDictionary = sqliteTable("objectives_dictionary", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  title: text("title").notNull(),
  description: text("description"),
  indicatorClusterId: text("indicator_cluster_id").notNull().references(() => indicatorClusters.id, { onDelete: "cascade" }),
  calculationTypeId: text("calculation_type_id").notNull().references(() => calculationTypes.id, { onDelete: "restrict" }),
  objectiveType: text("objective_type").notNull().default("numeric"), // "numeric" or "qualitative"
  targetValue: real("target_value"), // Target for numeric objectives
  thresholdValue: real("threshold_value"), // Threshold below which numeric objective is 0%
  thresholdPayout: real("threshold_payout").default(50), // Payout % at exactly threshold (default 50%)
  allowOverperformance: integer("allow_overperformance").default(0), // Boolean: allows >100% payout
  maxPayout: real("max_payout").default(120), // Max payout % when overperformance is enabled
  targetDescription: text("target_description"), // Detailed description of what reaching the target means
  dataSource: text("data_source"), // Data source / where result data comes from
  dataSourceEmail: text("data_source_email"), // Email of the person responsible for reporting this data source
  actualValue: real("actual_value"), // Actual value reported (for numeric objectives)
  qualitativeResult: text("qualitative_result"), // "reached", "partial", "not_reached"
  reportedAt: integer("reported_at"), // When the objective was reported
  deadline: integer("deadline"), // Unix timestamp — data di scadenza/verifica dell'obiettivo
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const insertObjectivesDictionarySchema = createInsertSchema(objectivesDictionary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  objectiveType: z.enum(["numeric", "qualitative"]).default("numeric"),
  targetValue: z.coerce.number().nullable().optional(),
  thresholdValue: z.coerce.number().nullable().optional(),
  thresholdPayout: z.coerce.number().min(0).max(100).nullable().optional(),
  allowOverperformance: z.coerce.number().int().min(0).max(1).nullable().optional(),
  maxPayout: z.coerce.number().min(100).nullable().optional(),
  targetDescription: z.string().nullable().optional(),
  dataSource: z.string().nullable().optional(),
  dataSourceEmail: z.string().email().nullable().optional(),
  deadline: z.coerce.number().int().nullable().optional(),
});

export type InsertObjectivesDictionary = z.infer<typeof insertObjectivesDictionarySchema>;
export type ObjectivesDictionary = typeof objectivesDictionary.$inferSelect;

// Objectives - Instances assigned to users
export const objectives = sqliteTable("objectives", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  dictionaryId: text("dictionary_id").notNull().references(() => objectivesDictionary.id, { onDelete: "restrict" }),
  clusterId: text("cluster_id").notNull().references(() => indicatorClusters.id, { onDelete: "cascade" }),
  deadline: integer("deadline"),
  // Reporting fields
  actualValue: real("actual_value"), // Reported value for numeric objectives
  qualitativeResult: text("qualitative_result"), // "reached" or "not_reached" for qualitative objectives
  reportedAt: integer("reported_at"), // When the reporting was done
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const objectiveAssignments = sqliteTable("objective_assignments", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  objectiveId: text("objective_id").notNull().references(() => objectives.id, { onDelete: "cascade" }),
  weight: integer("weight"), // Weight for this assignment (defined at assignment time, multiples of 5%)
  status: text("status").notNull().default("assegnato"), // assegnato, in_corso, completato, da_approvare
  progress: integer("progress").notNull().default(0), // 0-100
  assignedAt: integer("assigned_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // regulation, policy, contract
  filePath: text("file_path"),
  requiresAcceptance: integer("requires_acceptance", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Document Acceptances
export const documentAcceptances = sqliteTable("document_acceptances", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  acceptedAt: integer("accepted_at").default(sql`(unixepoch())`),
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
export const mboRegulationAcceptances = sqliteTable("mbo_regulation_acceptances", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  acceptedAt: integer("accepted_at").default(sql`(unixepoch())`),
}, (table) => ({
  uniqueUserAcceptance: uniqueIndex("unique_mbo_user_acceptance").on(table.userId),
}));

export const insertMboRegulationAcceptanceSchema = createInsertSchema(mboRegulationAcceptances).omit({
  id: true,
  acceptedAt: true,
});

export type InsertMboRegulationAcceptance = z.infer<typeof insertMboRegulationAcceptanceSchema>;
export type MboRegulationAcceptance = typeof mboRegulationAcceptances.$inferSelect;

// Entry Gate - Indicatore aziendale che condiziona l'erogazione del bonus MBO
export const entryGate = sqliteTable("entry_gate", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  year: integer("year").notNull(),
  indicatorName: text("indicator_name").notNull(), // Es. "EBITDA", "Fatturato", "Margine Operativo"
  targetValue: real("target_value").notNull(),
  actualValue: real("actual_value"),
  thresholdPct: integer("threshold_pct").notNull().default(95), // Soglia % (default 95%)
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const insertEntryGateSchema = createInsertSchema(entryGate).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  targetValue: z.coerce.number(),
  actualValue: z.coerce.number().nullable().optional(),
  thresholdPct: z.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export type InsertEntryGate = z.infer<typeof insertEntryGateSchema>;
export type EntryGate = typeof entryGate.$inferSelect;

// App Settings - key/value store for platform configuration
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export type AppSetting = typeof appSettings.$inferSelect;

// Reporting Log - Audit trail of all rendicontazione events
export const reportingLog = sqliteTable("reporting_log", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  dictionaryId: text("dictionary_id").notNull().references(() => objectivesDictionary.id, { onDelete: "cascade" }),
  reportedByUserId: text("reported_by_user_id").references(() => users.id, { onDelete: "set null" }),
  reportingChannel: text("reporting_channel").notNull(), // "email_link" | "admin_manual" | "rendicontatore"
  actualValue: real("actual_value"),
  qualitativeResult: text("qualitative_result"),
  notes: text("notes"),
  reportedAt: integer("reported_at").default(sql`(unixepoch())`),
});

export const insertReportingLogSchema = createInsertSchema(reportingLog).omit({ id: true, reportedAt: true });
export type InsertReportingLog = z.infer<typeof insertReportingLogSchema>;
export type ReportingLog = typeof reportingLog.$inferSelect;

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
export const customFieldDefinitions = sqliteTable("custom_field_definitions", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  fieldName: text("field_name").notNull(), // Internal name (snake_case)
  fieldLabel: text("field_label").notNull(), // Display label
  fieldType: text("field_type").notNull(), // text, number, date, select, multiselect, boolean, email, phone, url
  category: text("category").notNull(), // personal, contact, organizational, professional, custom
  section: text("section"), // Which section of the profile to display in
  isRequired: integer("is_required", { mode: "boolean" }).notNull().default(false),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isSearchable: integer("is_searchable", { mode: "boolean" }).notNull().default(false),
  displayOrder: integer("display_order").default(0),
  placeholder: text("placeholder"),
  helpText: text("help_text"),
  validationRules: text("validation_rules"), // JSON for min, max, pattern, etc.
  options: text("options"), // For select/multiselect: [{value: "opt1", label: "Option 1"}]
  defaultValue: text("default_value"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const customFieldValues = sqliteTable("custom_field_values", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  fieldId: text("field_id").notNull().references(() => customFieldDefinitions.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  value: text("value"), // Stored as text, parsed based on field type
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const competencyModels = sqliteTable("competency_models", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  name: text("name").notNull(), // "Executive Competencies", "Manager Competencies"
  description: text("description"),
  personaType: text("persona_type").notNull(), // "executive", "manager", "professional", "individual_contributor"
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const userCompetencyModelAssignments = sqliteTable("user_competency_model_assignments", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  competencyModelId: text("competency_model_id").notNull().references(() => competencyModels.id, { onDelete: "cascade" }),
  assignedAt: integer("assigned_at").default(sql`(unixepoch())`),
  assignedBy: text("assigned_by").references(() => users.id, { onDelete: "set null" }),
  validFrom: integer("valid_from").notNull().default(sql`(unixepoch())`),
  validTo: integer("valid_to"),
  isCurrent: integer("is_current", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
}, (table) => ({
  uniqueUserModelCurrent: uniqueIndex("unique_user_model_current").on(table.userId, table.competencyModelId, table.isCurrent),
}));

export const insertUserCompetencyModelAssignmentSchema = createInsertSchema(userCompetencyModelAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assignedAt: true,
}).extend({
  validFrom: z.union([z.string(), z.number(), z.date()]).transform(val => 
    typeof val === 'number' ? val : Math.floor(new Date(val).getTime() / 1000)
  ),
  validTo: z.union([z.string(), z.number(), z.date(), z.null()]).transform(val => 
    val === null ? null : (typeof val === 'number' ? val : Math.floor(new Date(val).getTime() / 1000))
  ).nullable().optional(),
});

export type InsertUserCompetencyModelAssignment = z.infer<typeof insertUserCompetencyModelAssignmentSchema>;
export type UserCompetencyModelAssignment = typeof userCompetencyModelAssignments.$inferSelect;

// Competencies - Individual competency definitions
export const competencies = sqliteTable("competencies", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  modelId: text("model_id").notNull().references(() => competencyModels.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Leadership", "Problem Solving", "Communication"
  description: text("description"),
  category: text("category"), // "technical", "behavioral", "leadership", "transversal"
  isTransversal: integer("is_transversal", { mode: "boolean" }).notNull().default(false), // Shared across multiple personas
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const evaluationCycles = sqliteTable("evaluation_cycles", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  name: text("name").notNull(), // "Ciclo 2024", "Performance Review 2024"
  year: integer("year").notNull(),
  status: text("status").notNull().default("draft"), // "draft", "active", "completed", "archived"

  // Phase dates
  selfAssessmentStart: integer("self_assessment_start"),
  selfAssessmentEnd: integer("self_assessment_end"),
  peerFeedbackStart: integer("peer_feedback_start"),
  peerFeedbackEnd: integer("peer_feedback_end"),
  managerEvaluationStart: integer("manager_evaluation_start"),
  managerEvaluationEnd: integer("manager_evaluation_end"),
  feedbackDeliveryStart: integer("feedback_delivery_start"),
  feedbackDeliveryEnd: integer("feedback_delivery_end"),

  // Configuration
  enable360Feedback: integer("enable_360_feedback", { mode: "boolean" }).notNull().default(false),

  // Metadata
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const insertEvaluationCycleSchema = createInsertSchema(evaluationCycles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["draft", "active", "completed", "archived"]).default("draft"),
  createdBy: z.string().optional(),
  // Convert date strings to Date objects, handle empty strings and null values
  selfAssessmentStart: z.union([z.string(), z.number(), z.date(), z.null()]).transform(val => !val || val === '' ? null : (typeof val === 'number' ? val : Math.floor(new Date(val).getTime() / 1000))).nullable().optional(),
  selfAssessmentEnd: z.union([z.string(), z.number(), z.date(), z.null()]).transform(val => !val || val === '' ? null : (typeof val === 'number' ? val : Math.floor(new Date(val).getTime() / 1000))).nullable().optional(),
  peerFeedbackStart: z.union([z.string(), z.number(), z.date(), z.null()]).transform(val => !val || val === '' ? null : (typeof val === 'number' ? val : Math.floor(new Date(val).getTime() / 1000))).nullable().optional(),
  peerFeedbackEnd: z.union([z.string(), z.number(), z.date(), z.null()]).transform(val => !val || val === '' ? null : (typeof val === 'number' ? val : Math.floor(new Date(val).getTime() / 1000))).nullable().optional(),
  managerEvaluationStart: z.union([z.string(), z.number(), z.date(), z.null()]).transform(val => !val || val === '' ? null : (typeof val === 'number' ? val : Math.floor(new Date(val).getTime() / 1000))).nullable().optional(),
  managerEvaluationEnd: z.union([z.string(), z.number(), z.date(), z.null()]).transform(val => !val || val === '' ? null : (typeof val === 'number' ? val : Math.floor(new Date(val).getTime() / 1000))).nullable().optional(),
  feedbackDeliveryStart: z.union([z.string(), z.number(), z.date(), z.null()]).transform(val => !val || val === '' ? null : (typeof val === 'number' ? val : Math.floor(new Date(val).getTime() / 1000))).nullable().optional(),
  feedbackDeliveryEnd: z.union([z.string(), z.number(), z.date(), z.null()]).transform(val => !val || val === '' ? null : (typeof val === 'number' ? val : Math.floor(new Date(val).getTime() / 1000))).nullable().optional(),
});

export type InsertEvaluationCycle = z.infer<typeof insertEvaluationCycleSchema>;
export type EvaluationCycle = typeof evaluationCycles.$inferSelect;

// Self Assessments - Employee self-evaluations
export const selfAssessments = sqliteTable("self_assessments", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  cycleId: text("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  competencyId: text("competency_id").notNull().references(() => competencies.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment").notNull(),
  submittedAt: integer("submitted_at"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const overallSelfAssessments = sqliteTable("overall_self_assessments", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  cycleId: text("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  overallRating: integer("overall_rating").notNull(), // 1-5
  overallComment: text("overall_comment").notNull(),
  strengths: text("strengths"), // Punti di forza
  areasForImprovement: text("areas_for_improvement"), // Aree di miglioramento
  goals: text("goals"), // Obiettivi futuri
  submittedAt: integer("submitted_at"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const peerFeedbackRequests = sqliteTable("peer_feedback_requests", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  cycleId: text("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  requestorUserId: text("requestor_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  peerUserId: text("peer_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // "pending", "completed", "declined"
  requestedAt: integer("requested_at").default(sql`(unixepoch())`),
  completedAt: integer("completed_at"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const peerFeedbacks = sqliteTable("peer_feedbacks", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  requestId: text("request_id").notNull().references(() => peerFeedbackRequests.id, { onDelete: "cascade" }),
  cycleId: text("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  requestorUserId: text("requestor_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  peerUserId: text("peer_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  competencyId: text("competency_id").notNull().references(() => competencies.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment").notNull(),
  isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(true),
  submittedAt: integer("submitted_at"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const managerEvaluations = sqliteTable("manager_evaluations", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  cycleId: text("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  employeeUserId: text("employee_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  managerUserId: text("manager_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  competencyId: text("competency_id").notNull().references(() => competencies.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment").notNull(),
  submittedAt: integer("submitted_at"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const developmentPlans = sqliteTable("development_plans", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  cycleId: text("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  employeeUserId: text("employee_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  managerUserId: text("manager_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Competencies to develop (array of competency IDs)
  competenciesToDevelop: text("competencies_to_develop"), // ["comp-id-1", "comp-id-2"]

  // Development goals
  developmentGoals: text("development_goals").notNull(),

  // Action items with deadlines and status
  actionItems: text("action_items"), // [{ action: "...", deadline: "...", status: "..." }]

  // Notes
  managerNotes: text("manager_notes"),
  employeeNotes: text("employee_notes"),

  // Timeline
  feedbackSessionDate: integer("feedback_session_date"),
  reviewDate: integer("review_date"),

  status: text("status").notNull().default("draft"), // "draft", "agreed", "in_progress", "completed"
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
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
export const evaluationNotifications = sqliteTable("evaluation_notifications", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  cycleId: text("cycle_id").notNull().references(() => evaluationCycles.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  notificationType: text("notification_type").notNull(), // "self_assessment_reminder", "peer_feedback_request", etc.
  phase: text("phase").notNull(), // "self_assessment", "peer_feedback", "manager_evaluation", "feedback_delivery"
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  sentAt: integer("sent_at").default(sql`(unixepoch())`),
  readAt: integer("read_at"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
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
