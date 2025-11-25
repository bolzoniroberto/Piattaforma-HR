// Integration: javascript_database
import {
  users,
  objectiveClusters,
  objectives,
  objectiveAssignments,
  documents,
  documentAcceptances,
  type User,
  type UpsertUser,
  type ObjectiveCluster,
  type InsertObjectiveCluster,
  type Objective,
  type InsertObjective,
  type ObjectiveAssignment,
  type InsertObjectiveAssignment,
  type Document,
  type InsertDocument,
  type DocumentAcceptance,
  type InsertDocumentAcceptance,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Objective Cluster operations
  getObjectiveClusters(): Promise<ObjectiveCluster[]>;
  getObjectiveCluster(id: string): Promise<ObjectiveCluster | undefined>;
  createObjectiveCluster(cluster: InsertObjectiveCluster): Promise<ObjectiveCluster>;
  updateObjectiveCluster(id: string, cluster: Partial<InsertObjectiveCluster>): Promise<ObjectiveCluster>;
  deleteObjectiveCluster(id: string): Promise<void>;
  
  // Objective operations
  getObjectives(): Promise<Objective[]>;
  getObjective(id: string): Promise<Objective | undefined>;
  getObjectivesByCluster(clusterId: string): Promise<Objective[]>;
  createObjective(objective: InsertObjective): Promise<Objective>;
  updateObjective(id: string, objective: Partial<InsertObjective>): Promise<Objective>;
  deleteObjective(id: string): Promise<void>;
  
  // Objective Assignment operations
  getObjectiveAssignments(userId: string): Promise<(ObjectiveAssignment & { objective: Objective; cluster: ObjectiveCluster })[]>;
  getObjectiveAssignment(id: string): Promise<ObjectiveAssignment | undefined>;
  createObjectiveAssignment(assignment: InsertObjectiveAssignment): Promise<ObjectiveAssignment>;
  updateObjectiveAssignment(id: string, assignment: Partial<InsertObjectiveAssignment>): Promise<ObjectiveAssignment>;
  deleteObjectiveAssignment(id: string): Promise<void>;
  
  // Document operations
  getDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  
  // Document Acceptance operations
  getUserDocumentAcceptances(userId: string): Promise<DocumentAcceptance[]>;
  acceptDocument(acceptance: InsertDocumentAcceptance): Promise<DocumentAcceptance>;
  isDocumentAccepted(userId: string, documentId: string): Promise<boolean>;
  
  // Statistics
  getUserStats(userId: string): Promise<{ totalObjectives: number; completedObjectives: number }>;
  getClusterStats(userId: string): Promise<Array<{ clusterId: string; clusterName: string; progress: number }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Objective Cluster operations
  async getObjectiveClusters(): Promise<ObjectiveCluster[]> {
    return await db.select().from(objectiveClusters).orderBy(objectiveClusters.name);
  }

  async getObjectiveCluster(id: string): Promise<ObjectiveCluster | undefined> {
    const [cluster] = await db.select().from(objectiveClusters).where(eq(objectiveClusters.id, id));
    return cluster;
  }

  async createObjectiveCluster(clusterData: InsertObjectiveCluster): Promise<ObjectiveCluster> {
    const [cluster] = await db.insert(objectiveClusters).values(clusterData).returning();
    return cluster;
  }

  async updateObjectiveCluster(id: string, clusterData: Partial<InsertObjectiveCluster>): Promise<ObjectiveCluster> {
    const [cluster] = await db
      .update(objectiveClusters)
      .set({ ...clusterData, updatedAt: new Date() })
      .where(eq(objectiveClusters.id, id))
      .returning();
    return cluster;
  }

  async deleteObjectiveCluster(id: string): Promise<void> {
    await db.delete(objectiveClusters).where(eq(objectiveClusters.id, id));
  }

  // Objective operations
  async getObjectives(): Promise<Objective[]> {
    return await db.select().from(objectives).orderBy(desc(objectives.createdAt));
  }

  async getObjective(id: string): Promise<Objective | undefined> {
    const [objective] = await db.select().from(objectives).where(eq(objectives.id, id));
    return objective;
  }

  async getObjectivesByCluster(clusterId: string): Promise<Objective[]> {
    return await db.select().from(objectives).where(eq(objectives.clusterId, clusterId));
  }

  async createObjective(objectiveData: InsertObjective): Promise<Objective> {
    const [objective] = await db.insert(objectives).values(objectiveData).returning();
    return objective;
  }

  async updateObjective(id: string, objectiveData: Partial<InsertObjective>): Promise<Objective> {
    const [objective] = await db
      .update(objectives)
      .set({ ...objectiveData, updatedAt: new Date() })
      .where(eq(objectives.id, id))
      .returning();
    return objective;
  }

  async deleteObjective(id: string): Promise<void> {
    await db.delete(objectives).where(eq(objectives.id, id));
  }

  // Objective Assignment operations
  async getObjectiveAssignments(userId: string): Promise<(ObjectiveAssignment & { objective: Objective; cluster: ObjectiveCluster })[]> {
    const results = await db
      .select({
        assignment: objectiveAssignments,
        objective: objectives,
        cluster: objectiveClusters,
      })
      .from(objectiveAssignments)
      .innerJoin(objectives, eq(objectiveAssignments.objectiveId, objectives.id))
      .innerJoin(objectiveClusters, eq(objectives.clusterId, objectiveClusters.id))
      .where(eq(objectiveAssignments.userId, userId))
      .orderBy(desc(objectiveAssignments.assignedAt));

    return results.map((row) => ({
      ...row.assignment,
      objective: row.objective,
      cluster: row.cluster,
    }));
  }

  async getObjectiveAssignment(id: string): Promise<ObjectiveAssignment | undefined> {
    const [assignment] = await db.select().from(objectiveAssignments).where(eq(objectiveAssignments.id, id));
    return assignment;
  }

  async createObjectiveAssignment(assignmentData: InsertObjectiveAssignment): Promise<ObjectiveAssignment> {
    const [assignment] = await db.insert(objectiveAssignments).values(assignmentData).returning();
    return assignment;
  }

  async updateObjectiveAssignment(id: string, assignmentData: Partial<InsertObjectiveAssignment>): Promise<ObjectiveAssignment> {
    const [assignment] = await db
      .update(objectiveAssignments)
      .set({ ...assignmentData, updatedAt: new Date() })
      .where(eq(objectiveAssignments.id, id))
      .returning();
    return assignment;
  }

  async deleteObjectiveAssignment(id: string): Promise<void> {
    await db.delete(objectiveAssignments).where(eq(objectiveAssignments.id, id));
  }

  // Document operations
  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }

  async updateDocument(id: string, documentData: Partial<InsertDocument>): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set({ ...documentData, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Document Acceptance operations
  async getUserDocumentAcceptances(userId: string): Promise<DocumentAcceptance[]> {
    return await db.select().from(documentAcceptances).where(eq(documentAcceptances.userId, userId));
  }

  async acceptDocument(acceptanceData: InsertDocumentAcceptance): Promise<DocumentAcceptance> {
    const [acceptance] = await db.insert(documentAcceptances).values(acceptanceData).returning();
    return acceptance;
  }

  async isDocumentAccepted(userId: string, documentId: string): Promise<boolean> {
    const [acceptance] = await db
      .select()
      .from(documentAcceptances)
      .where(and(eq(documentAcceptances.userId, userId), eq(documentAcceptances.documentId, documentId)));
    return !!acceptance;
  }

  // Statistics
  async getUserStats(userId: string): Promise<{ totalObjectives: number; completedObjectives: number }> {
    const result = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${objectiveAssignments.status} = 'completato')`,
      })
      .from(objectiveAssignments)
      .where(eq(objectiveAssignments.userId, userId));

    return {
      totalObjectives: Number(result[0]?.total || 0),
      completedObjectives: Number(result[0]?.completed || 0),
    };
  }

  async getClusterStats(userId: string): Promise<Array<{ clusterId: string; clusterName: string; progress: number }>> {
    const results = await db
      .select({
        clusterId: objectiveClusters.id,
        clusterName: objectiveClusters.name,
        avgProgress: sql<number>`avg(${objectiveAssignments.progress})`,
      })
      .from(objectiveAssignments)
      .innerJoin(objectives, eq(objectiveAssignments.objectiveId, objectives.id))
      .innerJoin(objectiveClusters, eq(objectives.clusterId, objectiveClusters.id))
      .where(eq(objectiveAssignments.userId, userId))
      .groupBy(objectiveClusters.id, objectiveClusters.name);

    return results.map((row) => ({
      clusterId: row.clusterId,
      clusterName: row.clusterName,
      progress: Math.round(Number(row.avgProgress || 0)),
    }));
  }
}

export const storage = new DatabaseStorage();
