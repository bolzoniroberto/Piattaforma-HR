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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// Objective Clusters
export const objectiveClusters = pgTable("objective_clusters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  weight: integer("weight").notNull().default(33), // percentage weight in evaluation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertObjectiveClusterSchema = createInsertSchema(objectiveClusters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertObjectiveCluster = z.infer<typeof insertObjectiveClusterSchema>;
export type ObjectiveCluster = typeof objectiveClusters.$inferSelect;

// Objectives
export const objectives = pgTable("objectives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  clusterId: varchar("cluster_id").notNull().references(() => objectiveClusters.id, { onDelete: "cascade" }),
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

// Objective Assignments (linking users to objectives)
export const objectiveAssignments = pgTable("objective_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  objectiveId: varchar("objective_id").notNull().references(() => objectives.id, { onDelete: "cascade" }),
  status: varchar("status").notNull().default("assegnato"), // assegnato, in_corso, completato, da_approvare
  progress: integer("progress").notNull().default(0), // 0-100
  assignedAt: timestamp("assigned_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertObjectiveAssignmentSchema = createInsertSchema(objectiveAssignments).omit({
  id: true,
  assignedAt: true,
  updatedAt: true,
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
});

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

export const objectiveClustersRelations = relations(objectiveClusters, ({ many }) => ({
  objectives: many(objectives),
}));

export const objectivesRelations = relations(objectives, ({ one, many }) => ({
  cluster: one(objectiveClusters, {
    fields: [objectives.clusterId],
    references: [objectiveClusters.id],
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
