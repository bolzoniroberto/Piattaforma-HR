// Integration: javascript_database
import {
  users,
  indicatorClusters,
  calculationTypes,
  businessFunctions,
  objectivesDictionary,
  objectives,
  objectiveAssignments,
  documents,
  documentAcceptances,
  mboRegulationAcceptances,
  type User,
  type UpsertUser,
  type IndicatorCluster,
  type InsertIndicatorCluster,
  type CalculationType,
  type InsertCalculationType,
  type BusinessFunction,
  type InsertBusinessFunction,
  type ObjectivesDictionary,
  type InsertObjectivesDictionary,
  type Objective,
  type InsertObjective,
  type ObjectiveAssignment,
  type InsertObjectiveAssignment,
  type Document,
  type InsertDocument,
  type DocumentAcceptance,
  type InsertDocumentAcceptance,
  type MboRegulationAcceptance,
  type InsertMboRegulationAcceptance,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IStorage {
  // User operations - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getAllUsersPaginated(params?: PaginationParams): Promise<PaginatedResponse<User>>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Indicator Cluster operations
  getIndicatorClusters(): Promise<IndicatorCluster[]>;
  getIndicatorCluster(id: string): Promise<IndicatorCluster | undefined>;
  createIndicatorCluster(cluster: InsertIndicatorCluster): Promise<IndicatorCluster>;
  updateIndicatorCluster(id: string, cluster: Partial<InsertIndicatorCluster>): Promise<IndicatorCluster>;
  deleteIndicatorCluster(id: string): Promise<void>;
  
  // Calculation Type operations
  getCalculationTypes(): Promise<CalculationType[]>;
  getCalculationType(id: string): Promise<CalculationType | undefined>;
  createCalculationType(type: InsertCalculationType): Promise<CalculationType>;
  updateCalculationType(id: string, type: Partial<InsertCalculationType>): Promise<CalculationType>;
  deleteCalculationType(id: string): Promise<void>;
  
  // Business Function operations
  getBusinessFunctions(): Promise<BusinessFunction[]>;
  getBusinessFunction(id: string): Promise<BusinessFunction | undefined>;
  createBusinessFunction(business: InsertBusinessFunction): Promise<BusinessFunction>;
  updateBusinessFunction(id: string, business: Partial<InsertBusinessFunction>): Promise<BusinessFunction>;
  deleteBusinessFunction(id: string): Promise<void>;
  
  // Objectives Dictionary operations
  getObjectivesDictionary(): Promise<(ObjectivesDictionary & { indicatorCluster: IndicatorCluster; calculationType: CalculationType })[]>;
  getObjectivesDictionaryItem(id: string): Promise<(ObjectivesDictionary & { indicatorCluster: IndicatorCluster; calculationType: CalculationType }) | undefined>;
  createObjectivesDictionaryItem(item: InsertObjectivesDictionary): Promise<ObjectivesDictionary>;
  updateObjectivesDictionaryItem(id: string, item: Partial<InsertObjectivesDictionary>): Promise<ObjectivesDictionary>;
  deleteObjectivesDictionaryItem(id: string): Promise<void>;
  
  // Objective operations
  getObjectives(): Promise<Objective[]>;
  getObjective(id: string): Promise<Objective | undefined>;
  createObjective(objective: InsertObjective): Promise<Objective>;
  updateObjective(id: string, objective: Partial<InsertObjective>): Promise<Objective>;
  deleteObjective(id: string): Promise<void>;
  getObjectivesWithAssignments(): Promise<{
    objective: Objective;
    dictionary: ObjectivesDictionary | null;
    indicatorCluster: IndicatorCluster | null;
    calculationType: CalculationType | null;
    assignedUsers: { user: User; assignment: ObjectiveAssignment }[];
  }[]>;
  
  // Objective Assignment operations
  getObjectiveAssignments(userId: string): Promise<(ObjectiveAssignment & { objective: Omit<Objective, 'actualValue' | 'targetValue'> & { title?: string; description?: string; objectiveType?: string; targetValue?: number | null; actualValue?: number | null } })[]>;
  getAllObjectiveAssignments(): Promise<ObjectiveAssignment[]>;
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
  
  // MBO Regulation Acceptance operations
  getMboRegulationAcceptances(): Promise<MboRegulationAcceptance[]>;
  acceptMboRegulation(acceptance: InsertMboRegulationAcceptance): Promise<MboRegulationAcceptance>;
  
  // Statistics
  getUserStats(userId: string): Promise<{ totalObjectives: number; completedObjectives: number }>;

  // Org Chart
  getOrgChartUsers(userId: string, isAdmin: boolean): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const dbData = {
      ...userData,
    } as any;

    const [user] = await db
      .insert(users)
      .values(dbData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...dbData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.lastName, users.firstName);
  }

  async getAllUsersPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<User>> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    // Fetch data and count in parallel
    const [data, countResult] = await Promise.all([
      db.select()
        .from(users)
        .orderBy(users.lastName, users.firstName)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(users)
    ]);

    const total = Number(countResult[0].count);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const dbData: any = {
      ...userData,
      updatedAt: new Date(),
    };

    // Remove undefined fields to prevent Drizzle from ignoring updates
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key];
      }
    });

    const [user] = await db
      .update(users)
      .set(dbData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Indicator Cluster operations
  async getIndicatorClusters(): Promise<IndicatorCluster[]> {
    return await db.select().from(indicatorClusters).orderBy(indicatorClusters.name);
  }

  async getIndicatorCluster(id: string): Promise<IndicatorCluster | undefined> {
    const [cluster] = await db.select().from(indicatorClusters).where(eq(indicatorClusters.id, id));
    return cluster;
  }

  async createIndicatorCluster(clusterData: InsertIndicatorCluster): Promise<IndicatorCluster> {
    const [cluster] = await db.insert(indicatorClusters).values(clusterData).returning();
    return cluster;
  }

  async updateIndicatorCluster(id: string, clusterData: Partial<InsertIndicatorCluster>): Promise<IndicatorCluster> {
    const [cluster] = await db
      .update(indicatorClusters)
      .set({ ...clusterData, updatedAt: new Date() })
      .where(eq(indicatorClusters.id, id))
      .returning();
    return cluster;
  }

  async deleteIndicatorCluster(id: string): Promise<void> {
    await db.delete(indicatorClusters).where(eq(indicatorClusters.id, id));
  }

  // Calculation Type operations
  async getCalculationTypes(): Promise<CalculationType[]> {
    return await db.select().from(calculationTypes).orderBy(calculationTypes.name);
  }

  async getCalculationType(id: string): Promise<CalculationType | undefined> {
    const [type] = await db.select().from(calculationTypes).where(eq(calculationTypes.id, id));
    return type;
  }

  async createCalculationType(typeData: InsertCalculationType): Promise<CalculationType> {
    const [type] = await db.insert(calculationTypes).values(typeData).returning();
    return type;
  }

  async updateCalculationType(id: string, typeData: Partial<InsertCalculationType>): Promise<CalculationType> {
    const [type] = await db
      .update(calculationTypes)
      .set({ ...typeData, updatedAt: new Date() })
      .where(eq(calculationTypes.id, id))
      .returning();
    return type;
  }

  async deleteCalculationType(id: string): Promise<void> {
    await db.delete(calculationTypes).where(eq(calculationTypes.id, id));
  }

  // Business Function operations
  async getBusinessFunctions(): Promise<BusinessFunction[]> {
    return await db.select().from(businessFunctions).orderBy(businessFunctions.name);
  }

  async getBusinessFunction(id: string): Promise<BusinessFunction | undefined> {
    const [business] = await db.select().from(businessFunctions).where(eq(businessFunctions.id, id));
    return business;
  }

  async createBusinessFunction(businessData: InsertBusinessFunction): Promise<BusinessFunction> {
    const [business] = await db.insert(businessFunctions).values(businessData).returning();
    return business;
  }

  async updateBusinessFunction(id: string, businessData: Partial<InsertBusinessFunction>): Promise<BusinessFunction> {
    const [business] = await db
      .update(businessFunctions)
      .set({ ...businessData, updatedAt: new Date() })
      .where(eq(businessFunctions.id, id))
      .returning();
    return business;
  }

  async deleteBusinessFunction(id: string): Promise<void> {
    await db.delete(businessFunctions).where(eq(businessFunctions.id, id));
  }

  // Objectives Dictionary operations
  async getObjectivesDictionary(): Promise<(ObjectivesDictionary & { indicatorCluster: IndicatorCluster; calculationType: CalculationType })[]> {
    try {
      const results = await db
        .select({
          item: objectivesDictionary,
          indicatorCluster: indicatorClusters,
          calculationType: calculationTypes,
        })
        .from(objectivesDictionary)
        .innerJoin(indicatorClusters, eq(objectivesDictionary.indicatorClusterId, indicatorClusters.id))
        .innerJoin(calculationTypes, eq(objectivesDictionary.calculationTypeId, calculationTypes.id))
        .orderBy(objectivesDictionary.title);

      return results.map((row) => ({
        ...row.item,
        indicatorCluster: row.indicatorCluster,
        calculationType: row.calculationType,
      }));
    } catch (error) {
      console.error("Error in getObjectivesDictionary:", error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  async getObjectivesDictionaryItem(id: string): Promise<(ObjectivesDictionary & { indicatorCluster: IndicatorCluster; calculationType: CalculationType }) | undefined> {
    const [result] = await db
      .select({
        item: objectivesDictionary,
        indicatorCluster: indicatorClusters,
        calculationType: calculationTypes,
      })
      .from(objectivesDictionary)
      .innerJoin(indicatorClusters, eq(objectivesDictionary.indicatorClusterId, indicatorClusters.id))
      .innerJoin(calculationTypes, eq(objectivesDictionary.calculationTypeId, calculationTypes.id))
      .where(eq(objectivesDictionary.id, id));

    if (!result) return undefined;
    return {
      ...result.item,
      indicatorCluster: result.indicatorCluster,
      calculationType: result.calculationType,
    };
  }

  async createObjectivesDictionaryItem(itemData: InsertObjectivesDictionary): Promise<ObjectivesDictionary> {
    const insertData: any = itemData;
    const [item] = await db.insert(objectivesDictionary).values(insertData).returning();
    return item;
  }

  async updateObjectivesDictionaryItem(id: string, itemData: Partial<InsertObjectivesDictionary>): Promise<ObjectivesDictionary> {
    const updateData: any = { ...itemData, updatedAt: new Date() };
    const [item] = await db
      .update(objectivesDictionary)
      .set(updateData)
      .where(eq(objectivesDictionary.id, id))
      .returning();
    return item;
  }

  async deleteObjectivesDictionaryItem(id: string): Promise<void> {
    await db.delete(objectives).where(eq(objectives.dictionaryId, id));
    await db.delete(objectivesDictionary).where(eq(objectivesDictionary.id, id));
  }

  // Objective operations
  async getObjectives(): Promise<Objective[]> {
    return await db.select().from(objectives).orderBy(desc(objectives.createdAt));
  }

  async getObjective(id: string): Promise<Objective | undefined> {
    const [objective] = await db.select().from(objectives).where(eq(objectives.id, id));
    return objective;
  }


  async createObjective(objectiveData: InsertObjective): Promise<Objective> {
    // Convert actualValue from number to string for database storage
    const dbData = {
      ...objectiveData,
      actualValue: objectiveData.actualValue !== undefined && objectiveData.actualValue !== null ? String(objectiveData.actualValue) : undefined,
    } as any;

    const [objective] = await db.insert(objectives).values(dbData).returning();
    return objective;
  }

  async updateObjective(id: string, objectiveData: Partial<InsertObjective>): Promise<Objective> {
    // Convert actualValue from number to string for database storage
    const dbData = {
      ...objectiveData,
      actualValue: objectiveData.actualValue !== undefined && objectiveData.actualValue !== null ? String(objectiveData.actualValue) : undefined,
      updatedAt: new Date(),
    } as any;

    const [objective] = await db
      .update(objectives)
      .set(dbData)
      .where(eq(objectives.id, id))
      .returning();
    return objective;
  }

  async deleteObjective(id: string): Promise<void> {
    await db.delete(objectives).where(eq(objectives.id, id));
  }

  async getObjectivesWithAssignments(): Promise<{
    dictionary: ObjectivesDictionary;
    indicatorCluster: IndicatorCluster | null;
    calculationType: CalculationType | null;
    assignedUsers: { user: User; assignment: ObjectiveAssignment; objective: Objective }[];
  }[]> {
    // Get all dictionaries with their assignments in a single query using LEFT JOINs
    const results = await db
      .select({
        dictionary: objectivesDictionary,
        indicatorCluster: indicatorClusters,
        calculationType: calculationTypes,
        assignment: objectiveAssignments,
        user: users,
        objective: objectives,
      })
      .from(objectivesDictionary)
      .leftJoin(indicatorClusters, eq(objectivesDictionary.indicatorClusterId, indicatorClusters.id))
      .leftJoin(calculationTypes, eq(objectivesDictionary.calculationTypeId, calculationTypes.id))
      .leftJoin(objectives, eq(objectives.dictionaryId, objectivesDictionary.id))
      .leftJoin(objectiveAssignments, eq(objectiveAssignments.objectiveId, objectives.id))
      .leftJoin(users, eq(objectiveAssignments.userId, users.id))
      .orderBy(desc(objectivesDictionary.createdAt));

    // Group by dictionary
    const groupedByDictionary = new Map<string, {
      dictionary: ObjectivesDictionary;
      indicatorCluster: IndicatorCluster | null;
      calculationType: CalculationType | null;
      assignedUsers: { user: User; assignment: ObjectiveAssignment; objective: Objective }[];
    }>();

    for (const row of results) {
      const dictionaryId = row.dictionary.id;

      if (!groupedByDictionary.has(dictionaryId)) {
        groupedByDictionary.set(dictionaryId, {
          dictionary: row.dictionary,
          indicatorCluster: row.indicatorCluster,
          calculationType: row.calculationType,
          assignedUsers: [],
        });
      }

      // Only add to assignedUsers if there's a valid assignment
      if (row.assignment && row.user && row.objective) {
        groupedByDictionary.get(dictionaryId)!.assignedUsers.push({
          user: row.user,
          assignment: row.assignment,
          objective: row.objective,
        });
      }
    }

    // Return all dictionaries that have at least one assignment
    return Array.from(groupedByDictionary.values())
      .filter(item => item.assignedUsers.length > 0);
  }

  // Objective Assignment operations
  async getObjectiveAssignments(userId: string): Promise<(ObjectiveAssignment & {
    objective: Omit<Objective, 'actualValue' | 'targetValue'> & {
      title?: string;
      description?: string;
      objectiveType?: string;
      targetValue?: number | null;
      actualValue?: number | null;
      indicatorCluster?: IndicatorCluster;
      calculationType?: CalculationType;
    }
  })[]> {
    const results = await db
      .select({
        assignment: objectiveAssignments,
        objective: objectives,
        dictionary: objectivesDictionary,
        indicatorCluster: indicatorClusters,
        calculationType: calculationTypes,
      })
      .from(objectiveAssignments)
      .leftJoin(objectives, eq(objectiveAssignments.objectiveId, objectives.id))
      .leftJoin(objectivesDictionary, eq(objectives.dictionaryId, objectivesDictionary.id))
      .leftJoin(indicatorClusters, eq(objectivesDictionary.indicatorClusterId, indicatorClusters.id))
      .leftJoin(calculationTypes, eq(objectivesDictionary.calculationTypeId, calculationTypes.id))
      .where(eq(objectiveAssignments.userId, userId))
      .orderBy(desc(objectiveAssignments.assignedAt));

    return results.map((row) => ({
      ...row.assignment,
      objective: {
        ...(row.objective || {} as any),
        title: row.dictionary?.title || "Obiettivo",
        description: row.dictionary?.description || "",
        objectiveType: row.dictionary?.objectiveType,
        targetValue: row.dictionary?.targetValue ? parseFloat(String(row.dictionary.targetValue)) : null,
        actualValue: row.objective?.actualValue ? parseFloat(String(row.objective.actualValue)) : null,
        indicatorCluster: row.indicatorCluster || undefined,
        calculationType: row.calculationType || undefined,
      },
    }));
  }

  async getAllObjectiveAssignments(): Promise<ObjectiveAssignment[]> {
    return await db.select().from(objectiveAssignments);
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

  // Update progress on all assignments for an objective
  async updateAssignmentProgressByObjective(objectiveId: string, progress: number): Promise<void> {
    await db
      .update(objectiveAssignments)
      .set({ progress })
      .where(eq(objectiveAssignments.objectiveId, objectiveId));
  }

  // Update dictionary with reporting data and propagate to all objectives and assignments
  async reportOnDictionary(dictionaryId: string, reportData: {
    actualValue?: number;
    qualitativeResult?: string;
    progress: number;
  }): Promise<void> {
    // Update the dictionary
    await db
      .update(objectivesDictionary)
      .set({
        actualValue: reportData.actualValue,
        qualitativeResult: reportData.qualitativeResult,
        reportedAt: new Date(),
      })
      .where(eq(objectivesDictionary.id, dictionaryId));

    // Get all objectives for this dictionary
    const relatedObjectives = await db
      .select()
      .from(objectives)
      .where(eq(objectives.dictionaryId, dictionaryId));

    // Update all objectives
    for (const objective of relatedObjectives) {
      await db
        .update(objectives)
        .set({
          actualValue: reportData.actualValue,
          qualitativeResult: reportData.qualitativeResult,
          reportedAt: new Date(),
        })
        .where(eq(objectives.id, objective.id));

      // Update all assignments for this objective
      await this.updateAssignmentProgressByObjective(objective.id, reportData.progress);
    }
  }

  // MBO Regulation Acceptance operations
  async getMboRegulationAcceptances(): Promise<MboRegulationAcceptance[]> {
    return await db.select().from(mboRegulationAcceptances).orderBy(desc(mboRegulationAcceptances.acceptedAt));
  }

  async acceptMboRegulation(acceptanceData: InsertMboRegulationAcceptance): Promise<MboRegulationAcceptance> {
    const [acceptance] = await db
      .insert(mboRegulationAcceptances)
      .values(acceptanceData)
      .onConflictDoUpdate({
        target: mboRegulationAcceptances.userId,
        set: {
          acceptedAt: new Date(),
        },
      })
      .returning();
    return acceptance;
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

  // Org Chart operations
  async getOrgChartUsers(userId: string, isAdmin: boolean): Promise<User[]> {
    // Admin: ritorna tutti gli utenti
    if (isAdmin) {
      return this.getAllUsers();
    }

    // Dipendente: costruisce lista filtrata
    const visibleUserIds = new Set<string>();

    // 1. Aggiungi utente corrente
    visibleUserIds.add(userId);

    // 2. Aggiungi catena manager (ricorsivo fino al top)
    await this.addManagerChain(userId, visibleUserIds);

    // 3. Aggiungi collaboratori diretti
    await this.addDirectReports(userId, visibleUserIds);

    // 4. Aggiungi colleghi (stesso managerId)
    await this.addPeers(userId, visibleUserIds);

    // Recupera e filtra utenti
    const allUsers = await this.getAllUsers();
    return allUsers.filter(u => visibleUserIds.has(u.id));
  }

  private async addManagerChain(
    userId: string,
    visibleIds: Set<string>,
    visited: Set<string> = new Set()
  ): Promise<void> {
    // Protezione da riferimenti circolari
    if (visited.has(userId)) {
      console.error(`Circular reference detected for user ${userId}`);
      return;
    }
    visited.add(userId);

    const user = await this.getUser(userId);
    if (!user || !user.managerId) return;

    visibleIds.add(user.managerId);
    await this.addManagerChain(user.managerId, visibleIds, visited);
  }

  private async addDirectReports(userId: string, visibleIds: Set<string>): Promise<void> {
    const allUsers = await this.getAllUsers();
    const reports = allUsers.filter(u => u.managerId === userId);
    reports.forEach(r => visibleIds.add(r.id));
  }

  private async addPeers(userId: string, visibleIds: Set<string>): Promise<void> {
    const user = await this.getUser(userId);
    if (!user || !user.managerId) return; // Top-level non ha colleghi

    const allUsers = await this.getAllUsers();
    const peers = allUsers.filter(u =>
      u.managerId === user.managerId && u.id !== userId
    );
    peers.forEach(p => visibleIds.add(p.id));
  }

}

export const storage = new DatabaseStorage();
