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
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("employee"), // employee or admin
  department: varchar("department"),
  managerId: varchar("manager_id").references(() => users.id, { onDelete: "set null" }), // Manager/responsabile
  ral: numeric("ral", { precision: 12, scale: 2 }), // Annual salary
  mboPercentage: integer("mbo_percentage"), // MBO percentage (in multiples of 5)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  department: true,
  managerId: true,
  ral: true,
  mboPercentage: true,
}).extend({
  mboPercentage: z.number().int().min(0).max(100).refine((val) => val % 5 === 0, {
    message: "MBO percentage must be a multiple of 5%",
  }).optional(),
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

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
  level: integer("level").notNull().default(1), // 1 = primo livello, 2 = secondo livello
  parentId: varchar("parent_id").references(() => businessFunctions.id, { onDelete: "cascade" }), // Reference to parent structure
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertObjectivesDictionarySchema = createInsertSchema(objectivesDictionary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertObjectivesDictionary = z.infer<typeof insertObjectivesDictionarySchema>;
export type ObjectivesDictionary = typeof objectivesDictionary.$inferSelect;

// Objectives - Instances assigned to users
export const objectives = pgTable("objectives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dictionaryId: varchar("dictionary_id").notNull().references(() => objectivesDictionary.id, { onDelete: "restrict" }),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertObjectiveSchema = createInsertSchema(objectives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  objectiveAssignments: many(objectiveAssignments),
  documentAcceptances: many(documentAcceptances),
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
