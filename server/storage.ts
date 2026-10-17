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
  appSettings,
  type AppSetting,
  entryGate,
  type EntryGate,
  type InsertEntryGate,
  reportingLog,
  type ReportingLog,
  docLetterheads,
  docTemplates,
  docGenerationJobs,
  docSigners,
  type DocLetterhead,
  type InsertDocLetterhead,
  type DocTemplate,
  type InsertDocTemplate,
  type DocGenerationJob,
  type InsertDocGenerationJob,
  type DocSigner,
  type InsertDocSigner,
  employeeLetters,
  type EmployeeLetter,
  type InsertEmployeeLetter,
  signatureRequests,
  letterSignatures,
  type SignatureRequest,
  type LetterSignature,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ne, inArray, isNull, gte, lt, TransactionRollbackError } from "drizzle-orm";

const nowUnix = () => Math.floor(Date.now() / 1000);

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
  getMboTeamMembers(managerId: string): Promise<User[]>;
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

  // App Settings
  getFeatureFlags(): Promise<Record<string, boolean>>;
  setFeatureFlags(flags: Record<string, boolean>): Promise<void>;
  getAppSetting(key: string): Promise<string | null>;
  setAppSetting(key: string, value: string): Promise<void>;

  // Entry Gate
  getEntryGates(year?: number): Promise<EntryGate[]>;
  getEntryGate(id: string): Promise<EntryGate | undefined>;
  createEntryGate(data: InsertEntryGate): Promise<EntryGate>;
  updateEntryGate(id: string, data: Partial<InsertEntryGate>): Promise<EntryGate>;
  deleteEntryGate(id: string): Promise<void>;

  // Reporting Log
  createReportingLogEntry(entry: { dictionaryId: string; reportedByUserId?: string | null; reportingChannel: string; actualValue?: number | null; qualitativeResult?: string | null; notes?: string | null; }): Promise<void>;
  getReportingLogByDictionary(dictionaryId: string): Promise<ReportingLog[]>;
  getAllReportingLog(): Promise<ReportingLog[]>;

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
          updatedAt: nowUnix(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.lastName, users.firstName);
  }

  async getMboTeamMembers(managerId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.managerId, managerId),
          sql`${users.mboPercentage} > 0`,
          eq(users.isActive, true)
        )
      )
      .orderBy(users.lastName, users.firstName);
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
      db.select({ count: sql<number>`count(*)` }).from(users)
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
      updatedAt: nowUnix(),
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
      .set({ ...clusterData, updatedAt: nowUnix() })
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
      .set({ ...typeData, updatedAt: nowUnix() })
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
      .set({ ...businessData, updatedAt: nowUnix() })
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
    const updateData: any = { ...itemData, updatedAt: nowUnix() };
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
      updatedAt: nowUnix(),
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
        targetDescription: row.dictionary?.targetDescription || null,
        dataSource: row.dictionary?.dataSource || null,
        objectiveType: row.dictionary?.objectiveType,
        targetValue: row.dictionary?.targetValue ? parseFloat(String(row.dictionary.targetValue)) : null,
        thresholdValue: row.dictionary?.thresholdValue ? parseFloat(String(row.dictionary.thresholdValue)) : null,
        thresholdPayout: row.dictionary?.thresholdPayout ?? 50,
        allowOverperformance: row.dictionary?.allowOverperformance ?? 0,
        maxPayout: row.dictionary?.maxPayout ?? null,
        actualValue: row.dictionary?.actualValue != null
          ? parseFloat(String(row.dictionary.actualValue))
          : (row.objective?.actualValue != null ? parseFloat(String(row.objective.actualValue)) : null),
        qualitativeResult: row.dictionary?.qualitativeResult || null,
        reportedAt: row.dictionary?.reportedAt || null,
        dataSourceEmail: row.dictionary?.dataSourceEmail || null,
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
      .set({ ...assignmentData, updatedAt: nowUnix() })
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
      .set({ ...documentData, updatedAt: nowUnix() })
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
    channel?: "email_link" | "admin_manual" | "rendicontatore" | "datasource_email";
    reportedByUserId?: string;
    notes?: string;
  }): Promise<void> {
    // Update the dictionary
    await db
      .update(objectivesDictionary)
      .set({
        actualValue: reportData.actualValue,
        qualitativeResult: reportData.qualitativeResult,
        reportedAt: nowUnix(),
      })
      .where(eq(objectivesDictionary.id, dictionaryId));

    // Update ALL objectives for this dictionary in one query
    await db
      .update(objectives)
      .set({
        actualValue: reportData.actualValue,
        qualitativeResult: reportData.qualitativeResult,
        reportedAt: nowUnix(),
      })
      .where(eq(objectives.dictionaryId, dictionaryId));

    // Update progress on ALL assignments for objectives of this dictionary
    const relatedObjectives = await db
      .select({ id: objectives.id })
      .from(objectives)
      .where(eq(objectives.dictionaryId, dictionaryId));

    for (const objective of relatedObjectives) {
      await this.updateAssignmentProgressByObjective(objective.id, reportData.progress);
    }

    // Log the reporting event
    await db.insert(reportingLog).values({
      dictionaryId,
      reportedByUserId: reportData.reportedByUserId ?? null,
      reportingChannel: reportData.channel ?? "admin_manual",
      actualValue: reportData.actualValue ?? null,
      qualitativeResult: reportData.qualitativeResult ?? null,
      notes: reportData.notes ?? null,
    });
  }

  async clearReportOnDictionary(dictionaryId: string): Promise<void> {
    await db
      .update(objectivesDictionary)
      .set({ actualValue: null, qualitativeResult: null, reportedAt: null })
      .where(eq(objectivesDictionary.id, dictionaryId));

    const relatedObjectives = await db
      .select()
      .from(objectives)
      .where(eq(objectives.dictionaryId, dictionaryId));

    for (const objective of relatedObjectives) {
      await db
        .update(objectives)
        .set({ actualValue: null, qualitativeResult: null, reportedAt: null })
        .where(eq(objectives.id, objective.id));

      await db
        .update(objectiveAssignments)
        .set({ progress: 0, status: "assegnato" })
        .where(eq(objectiveAssignments.objectiveId, objective.id));
    }
  }

  async createReportingLogEntry(entry: {
    dictionaryId: string;
    reportedByUserId?: string | null;
    reportingChannel: string;
    actualValue?: number | null;
    qualitativeResult?: string | null;
    notes?: string | null;
  }): Promise<void> {
    await db.insert(reportingLog).values({
      dictionaryId: entry.dictionaryId,
      reportedByUserId: entry.reportedByUserId ?? null,
      reportingChannel: entry.reportingChannel,
      actualValue: entry.actualValue ?? null,
      qualitativeResult: entry.qualitativeResult ?? null,
      notes: entry.notes ?? null,
    });
  }

  async getReportingLogByDictionary(dictionaryId: string): Promise<ReportingLog[]> {
    return await db
      .select()
      .from(reportingLog)
      .where(eq(reportingLog.dictionaryId, dictionaryId))
      .orderBy(desc(reportingLog.reportedAt));
  }

  async getAllReportingLog(): Promise<ReportingLog[]> {
    return await db
      .select()
      .from(reportingLog)
      .orderBy(desc(reportingLog.reportedAt));
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
          acceptedAt: sql`(unixepoch())`,
        },
      })
      .returning();
    return acceptance;
  }

  // App Settings
  async getFeatureFlags(): Promise<Record<string, boolean>> {
    const defaults = {
      gestione_anagrafiche_admin: true,
      gestione_anagrafiche_user: false,
      gestione_mbo_admin: true,
      gestione_mbo_user: true,
      gestione_organizzazione_admin: false,
      gestione_organizzazione_user: true,
      gestione_lettere_admin: true,
      gestione_lettere_user: true,
    };
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "feature_flags"));
    if (!row) return defaults;
    try {
      return { ...defaults, ...JSON.parse(row.value) };
    } catch {
      return defaults;
    }
  }

  async setFeatureFlags(flags: Record<string, boolean>): Promise<void> {
    await db.insert(appSettings)
      .values({ key: "feature_flags", value: JSON.stringify(flags) })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: JSON.stringify(flags), updatedAt: nowUnix() } });
  }

  async getAppSetting(key: string): Promise<string | null> {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return row?.value ?? null;
  }

  async setAppSetting(key: string, value: string): Promise<void> {
    await db.insert(appSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: nowUnix() } });
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

  // ===============================================
  // CUSTOM FIELDS - Delegate to customFieldsStorage
  // ===============================================

  async getCustomFieldDefinitions(includeInactive = false) {
    const { customFieldsStorage } = await import("./customFieldsStorage");
    return customFieldsStorage.getCustomFieldDefinitions(includeInactive);
  }

  async getCustomFieldDefinition(id: string) {
    const { customFieldsStorage } = await import("./customFieldsStorage");
    return customFieldsStorage.getCustomFieldDefinition(id);
  }

  async createCustomFieldDefinition(field: any) {
    const { customFieldsStorage } = await import("./customFieldsStorage");
    return customFieldsStorage.createCustomFieldDefinition(field);
  }

  async updateCustomFieldDefinition(id: string, field: any) {
    const { customFieldsStorage } = await import("./customFieldsStorage");
    return customFieldsStorage.updateCustomFieldDefinition(id, field);
  }

  async deleteCustomFieldDefinition(id: string) {
    const { customFieldsStorage } = await import("./customFieldsStorage");
    return customFieldsStorage.deleteCustomFieldDefinition(id);
  }

  async getCustomFieldValues(userId: string) {
    const { customFieldsStorage } = await import("./customFieldsStorage");
    return customFieldsStorage.getCustomFieldValues(userId);
  }

  async getCustomFieldValue(fieldId: string, userId: string) {
    const { customFieldsStorage } = await import("./customFieldsStorage");
    return customFieldsStorage.getCustomFieldValue(fieldId, userId);
  }

  async setCustomFieldValue(data: any) {
    const { customFieldsStorage } = await import("./customFieldsStorage");
    return customFieldsStorage.setCustomFieldValue(data);
  }

  async deleteCustomFieldValue(fieldId: string, userId: string) {
    const { customFieldsStorage } = await import("./customFieldsStorage");
    return customFieldsStorage.deleteCustomFieldValue(fieldId, userId);
  }

  // ── Entry Gate ────────────────────────────────────────────────────────────

  async getEntryGates(year?: number): Promise<EntryGate[]> {
    if (year !== undefined) {
      return db.select().from(entryGate).where(eq(entryGate.year, year)).orderBy(desc(entryGate.createdAt));
    }
    return db.select().from(entryGate).orderBy(desc(entryGate.createdAt));
  }

  async getEntryGate(id: string): Promise<EntryGate | undefined> {
    const [row] = await db.select().from(entryGate).where(eq(entryGate.id, id));
    return row;
  }

  async createEntryGate(data: InsertEntryGate): Promise<EntryGate> {
    const [row] = await db.insert(entryGate).values(data).returning();
    return row;
  }

  async updateEntryGate(id: string, data: Partial<InsertEntryGate>): Promise<EntryGate> {
    const [row] = await db.update(entryGate).set({ ...data, updatedAt: nowUnix() }).where(eq(entryGate.id, id)).returning();
    return row;
  }

  async deleteEntryGate(id: string): Promise<void> {
    await db.delete(entryGate).where(eq(entryGate.id, id));
  }

  // ─── Doc Generation ────────────────────────────────────────────────────────

  async getDocLetterheads(): Promise<DocLetterhead[]> {
    return db.select().from(docLetterheads).orderBy(desc(docLetterheads.uploadedAt));
  }

  async getDocLetterhead(id: string): Promise<DocLetterhead | undefined> {
    const [row] = await db.select().from(docLetterheads).where(eq(docLetterheads.id, id));
    return row;
  }

  async createDocLetterhead(data: InsertDocLetterhead): Promise<DocLetterhead> {
    const [row] = await db.insert(docLetterheads).values(data).returning();
    return row;
  }

  async deleteDocLetterhead(id: string): Promise<void> {
    await db.delete(docLetterheads).where(eq(docLetterheads.id, id));
  }

  async getDocTemplates(): Promise<DocTemplate[]> {
    return db.select().from(docTemplates).orderBy(desc(docTemplates.updatedAt));
  }

  async getDocTemplate(id: string): Promise<DocTemplate | undefined> {
    const [row] = await db.select().from(docTemplates).where(eq(docTemplates.id, id));
    return row;
  }

  async createDocTemplate(data: InsertDocTemplate): Promise<DocTemplate> {
    const [row] = await db.insert(docTemplates).values({ category: 'mbo', ...data }).returning();
    return row;
  }

  async updateDocTemplate(id: string, data: Partial<InsertDocTemplate>): Promise<DocTemplate> {
    const [row] = await db.update(docTemplates)
      .set({ ...data, updatedAt: nowUnix() })
      .where(eq(docTemplates.id, id))
      .returning();
    return row;
  }

  async deleteDocTemplate(id: string): Promise<void> {
    await db.delete(docTemplates).where(eq(docTemplates.id, id));
  }

  async duplicateDocTemplate(id: string): Promise<DocTemplate> {
    const src = await this.getDocTemplate(id);
    if (!src) throw new Error('Template non trovato');
    const [row] = await db.insert(docTemplates).values({
      name: src.name + ' (copia)',
      letterType: src.letterType,
      category: src.category ?? 'mbo',
      bodyContent: src.bodyContent,
      fieldMappings: src.fieldMappings,
      calculatedFields: src.calculatedFields,
      parameters: src.parameters,
      version: src.version + 1,
    }).returning();
    return row;
  }

  async getDocJobs(): Promise<DocGenerationJob[]> {
    return db.select().from(docGenerationJobs).orderBy(desc(docGenerationJobs.createdAt));
  }

  async createDocJob(data: InsertDocGenerationJob): Promise<DocGenerationJob> {
    const [row] = await db.insert(docGenerationJobs).values(data).returning();
    return row;
  }

  async updateDocJob(id: string, data: Partial<InsertDocGenerationJob>): Promise<DocGenerationJob> {
    const [row] = await db.update(docGenerationJobs)
      .set(data)
      .where(eq(docGenerationJobs.id, id))
      .returning();
    return row;
  }

  async getDocSigners(): Promise<DocSigner[]> {
    return db.select().from(docSigners).orderBy(desc(docSigners.uploadedAt));
  }

  async getDocSigner(id: string): Promise<DocSigner | undefined> {
    const [row] = await db.select().from(docSigners).where(eq(docSigners.id, id));
    return row;
  }

  async createDocSigner(data: InsertDocSigner): Promise<DocSigner> {
    const [row] = await db.insert(docSigners).values(data).returning();
    return row;
  }

  async updateDocSigner(id: string, data: Partial<InsertDocSigner>): Promise<DocSigner> {
    const [row] = await db.update(docSigners).set(data).where(eq(docSigners.id, id)).returning();
    return row;
  }

  async deleteDocSigner(id: string): Promise<void> {
    await db.delete(docSigners).where(eq(docSigners.id, id));
  }

  async setDefaultDocSigner(id: string): Promise<void> {
    await db.update(docSigners).set({ isDefault: 0 });
    await db.update(docSigners).set({ isDefault: 1 }).where(eq(docSigners.id, id));
  }

  // ─── Employee Letters ──────────────────────────────────────────────────────

  /** Letters visible to the employee: everything except drafts and revoked ones. */
  async getVisibleLettersForUser(userId: string): Promise<EmployeeLetter[]> {
    return db.select().from(employeeLetters)
      .where(and(
        eq(employeeLetters.userId, userId),
        inArray(employeeLetters.status, ['published', 'viewed', 'signed', 'superseded']),
      ))
      .orderBy(desc(employeeLetters.publishedAt));
  }

  /** Every published-at-some-point letter of a user, including revoked: used to rebuild version chains. */
  async getNonDraftLettersForUsers(userIds: string[]): Promise<EmployeeLetter[]> {
    if (!userIds.length) return [];
    return db.select().from(employeeLetters)
      .where(and(inArray(employeeLetters.userId, userIds), ne(employeeLetters.status, 'draft')));
  }

  async getLettersByJob(jobId: string): Promise<(EmployeeLetter & { userName: string })[]> {
    const rows = await db
      .select({ letter: employeeLetters, firstName: users.firstName, lastName: users.lastName })
      .from(employeeLetters)
      .innerJoin(users, eq(users.id, employeeLetters.userId))
      .where(eq(employeeLetters.jobId, jobId))
      .orderBy(users.lastName, users.firstName);
    return rows.map(r => ({ ...r.letter, userName: [r.firstName, r.lastName].filter(Boolean).join(' ') }));
  }

  /**
   * Current letters of the same template from other jobs: the versions a new
   * publication would replace. Signed ones are included so they can be linked
   * (they are never superseded). Most recent first.
   */
  async getReplaceableLetters(userId: string, templateId: string, excludeJobId: string): Promise<EmployeeLetter[]> {
    return db.select().from(employeeLetters)
      .where(and(
        eq(employeeLetters.userId, userId),
        eq(employeeLetters.templateId, templateId),
        ne(employeeLetters.jobId, excludeJobId),
        inArray(employeeLetters.status, ['published', 'viewed', 'signed']),
      ))
      .orderBy(desc(employeeLetters.publishedAt));
  }

  async supersedeEmployeeLetter(id: string): Promise<void> {
    await db.update(employeeLetters)
      .set({ status: 'superseded', supersededAt: nowUnix() })
      .where(and(eq(employeeLetters.id, id), inArray(employeeLetters.status, ['published', 'viewed'])));
  }

  async getEmployeeLetter(id: string): Promise<EmployeeLetter | undefined> {
    const [row] = await db.select().from(employeeLetters).where(eq(employeeLetters.id, id));
    return row;
  }

  async createEmployeeLetter(data: InsertEmployeeLetter): Promise<EmployeeLetter> {
    const [row] = await db.insert(employeeLetters).values(data).returning();
    return row;
  }

  async updateEmployeeLetter(id: string, data: Partial<InsertEmployeeLetter>): Promise<EmployeeLetter> {
    const [row] = await db.update(employeeLetters).set(data).where(eq(employeeLetters.id, id)).returning();
    return row;
  }

  /** Publishes the draft letters of a job (all of them, or only the given ids). */
  async publishJobLetters(
    jobId: string,
    opts: { letterIds?: string[]; publishedBy: string | null; requiresSignature: boolean; dueDate: number | null },
  ): Promise<EmployeeLetter[]> {
    const conditions = [eq(employeeLetters.jobId, jobId), eq(employeeLetters.status, 'draft')];
    if (opts.letterIds?.length) conditions.push(inArray(employeeLetters.id, opts.letterIds));
    return db.update(employeeLetters)
      .set({
        status: 'published',
        publishedAt: nowUnix(),
        publishedBy: opts.publishedBy,
        requiresSignature: opts.requiresSignature,
        dueDate: opts.dueDate,
      })
      .where(and(...conditions))
      .returning();
  }

  async revokeEmployeeLetter(id: string): Promise<EmployeeLetter | undefined> {
    const [row] = await db.update(employeeLetters)
      .set({ status: 'revoked', revokedAt: nowUnix() })
      .where(and(eq(employeeLetters.id, id), inArray(employeeLetters.status, ['published', 'viewed'])))
      .returning();
    return row;
  }

  // ─── Letter signatures ─────────────────────────────────────────────────────

  async hasLetterSignatures(userId: string): Promise<boolean> {
    const [row] = await db.select({ id: letterSignatures.id }).from(letterSignatures)
      .where(eq(letterSignatures.userId, userId)).limit(1);
    return !!row;
  }

  async getLetterSignature(letterId: string): Promise<LetterSignature | undefined> {
    const [row] = await db.select().from(letterSignatures).where(eq(letterSignatures.letterId, letterId));
    return row;
  }

  async getSignatureRequest(id: string): Promise<SignatureRequest | undefined> {
    const [row] = await db.select().from(signatureRequests).where(eq(signatureRequests.id, id));
    return row;
  }

  async getSignatureRequestsSince(letterId: string, since: number): Promise<SignatureRequest[]> {
    return db.select().from(signatureRequests)
      .where(and(eq(signatureRequests.letterId, letterId), gte(signatureRequests.createdAt, since)))
      .orderBy(desc(signatureRequests.createdAt));
  }

  /** Creates a new OTP request; any still-open request for the same letter stops being valid. */
  async createSignatureRequest(data: {
    id: string; letterId: string; userId: string; codeHash: string; sentTo: string; expiresAt: number; requestIp: string | null;
  }): Promise<SignatureRequest> {
    return db.transaction((tx) => {
      tx.update(signatureRequests)
        .set({ invalidatedAt: nowUnix() })
        .where(and(
          eq(signatureRequests.letterId, data.letterId),
          isNull(signatureRequests.consumedAt),
          isNull(signatureRequests.invalidatedAt),
        ))
        .run();
      return tx.insert(signatureRequests).values({ ...data, createdAt: nowUnix() }).returning().get();
    });
  }

  /**
   * Counts one verification attempt, atomically, and only while the request is
   * still usable. Returns the updated request, or undefined if it is not.
   */
  async registerOtpAttempt(id: string, maxAttempts: number): Promise<SignatureRequest | undefined> {
    const [row] = await db.update(signatureRequests)
      .set({ attempts: sql`${signatureRequests.attempts} + 1` })
      .where(and(
        eq(signatureRequests.id, id),
        isNull(signatureRequests.consumedAt),
        isNull(signatureRequests.invalidatedAt),
        lt(signatureRequests.attempts, maxAttempts),
      ))
      .returning();
    return row;
  }

  /**
   * Consumes the OTP, records the signature evidence and marks the letter as signed,
   * all or nothing. Returns undefined if the letter was no longer signable (concurrent
   * signature, revocation or replacement in the meantime).
   */
  async completeSignature(sig: Omit<LetterSignature, 'id'>): Promise<LetterSignature | undefined> {
    try {
      return this.completeSignatureTx(sig);
    } catch (err) {
      if (err instanceof TransactionRollbackError) return undefined;
      throw err;
    }
  }

  private completeSignatureTx(sig: Omit<LetterSignature, 'id'>): LetterSignature | undefined {
    return db.transaction((tx) => {
      const letter = tx.update(employeeLetters)
        .set({ status: 'signed', signedAt: sig.signedAt })
        .where(and(
          eq(employeeLetters.id, sig.letterId),
          inArray(employeeLetters.status, ['published', 'viewed']),
        ))
        .returning().get();
      if (!letter) return undefined;

      const consumed = tx.update(signatureRequests)
        .set({ consumedAt: sig.signedAt })
        .where(and(eq(signatureRequests.id, sig.signatureRequestId), isNull(signatureRequests.consumedAt)))
        .returning().get();
      if (!consumed) {
        tx.rollback();
        return undefined;
      }
      return tx.insert(letterSignatures).values(sig).returning().get();
    });
  }

  /** Sets viewedAt on first open; a no-op afterwards. */
  async markEmployeeLetterViewed(id: string): Promise<void> {
    await db.update(employeeLetters)
      .set({ status: 'viewed', viewedAt: nowUnix() })
      .where(and(eq(employeeLetters.id, id), eq(employeeLetters.status, 'published')));
  }
}

export const storage = new DatabaseStorage();
