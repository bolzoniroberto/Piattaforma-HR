import {
  competencyModels,
  competencies,
  evaluationCycles,
  selfAssessments,
  peerFeedbackRequests,
  peerFeedbacks,
  managerEvaluations,
  developmentPlans,
  evaluationNotifications,
  userCompetencyModelAssignments,
  overallSelfAssessments,
  users,
  type CompetencyModel,
  type InsertCompetencyModel,
  type Competency,
  type InsertCompetency,
  type EvaluationCycle,
  type InsertEvaluationCycle,
  type SelfAssessment,
  type InsertSelfAssessment,
  type PeerFeedbackRequest,
  type InsertPeerFeedbackRequest,
  type PeerFeedback,
  type InsertPeerFeedback,
  type ManagerEvaluation,
  type InsertManagerEvaluation,
  type DevelopmentPlan,
  type InsertDevelopmentPlan,
  type EvaluationNotification,
  type InsertEvaluationNotification,
  type UserCompetencyModelAssignment,
  type InsertUserCompetencyModelAssignment,
  type OverallSelfAssessment,
  type InsertOverallSelfAssessment,
  type User,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, avg, count, inArray } from "drizzle-orm";

export class CompetenciesStorage {
  // ==============================================
  // COMPETENCY MODELS
  // ==============================================

  async getCompetencyModels(filters?: { personaType?: string; isActive?: boolean }): Promise<CompetencyModel[]> {
    try {
      const conditions = [];
      if (filters?.personaType) {
        conditions.push(eq(competencyModels.personaType, filters.personaType));
      }
      if (filters?.isActive !== undefined) {
        conditions.push(eq(competencyModels.isActive, filters.isActive));
      }

      if (conditions.length > 0) {
        return await db.select().from(competencyModels).where(and(...conditions)).orderBy(competencyModels.createdAt);
      }
      return await db.select().from(competencyModels).orderBy(competencyModels.createdAt);
    } catch (error) {
      console.error("Error getting competency models:", error);
      throw error;
    }
  }

  async getCompetencyModel(id: string): Promise<CompetencyModel | undefined> {
    try {
      const result = await db.select().from(competencyModels).where(eq(competencyModels.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error(`Error getting competency model ${id}:`, error);
      throw error;
    }
  }

  async createCompetencyModel(data: InsertCompetencyModel): Promise<CompetencyModel> {
    try {
      const result = await db.insert(competencyModels).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating competency model:", error);
      throw error;
    }
  }

  async updateCompetencyModel(id: string, data: Partial<InsertCompetencyModel>): Promise<CompetencyModel> {
    try {
      const result = await db
        .update(competencyModels)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(competencyModels.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating competency model ${id}:`, error);
      throw error;
    }
  }

  async deleteCompetencyModel(id: string): Promise<void> {
    try {
      await db.delete(competencyModels).where(eq(competencyModels.id, id));
    } catch (error) {
      console.error(`Error deleting competency model ${id}:`, error);
      throw error;
    }
  }

  // ==============================================
  // COMPETENCIES
  // ==============================================

  async getCompetencies(filters?: { modelId?: string; isTransversal?: boolean }): Promise<Competency[]> {
    try {
      const conditions = [];
      if (filters?.modelId) {
        conditions.push(eq(competencies.modelId, filters.modelId));
      }
      if (filters?.isTransversal !== undefined) {
        conditions.push(eq(competencies.isTransversal, filters.isTransversal));
      }

      if (conditions.length > 0) {
        return await db.select().from(competencies).where(and(...conditions)).orderBy(competencies.displayOrder);
      }
      return await db.select().from(competencies).orderBy(competencies.displayOrder);
    } catch (error) {
      console.error("Error getting competencies:", error);
      throw error;
    }
  }

  async getCompetency(id: string): Promise<Competency | undefined> {
    try {
      const result = await db.select().from(competencies).where(eq(competencies.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error(`Error getting competency ${id}:`, error);
      throw error;
    }
  }

  async getCompetenciesByModelId(modelId: string): Promise<Competency[]> {
    try {
      return await db
        .select()
        .from(competencies)
        .where(eq(competencies.modelId, modelId))
        .orderBy(competencies.displayOrder);
    } catch (error) {
      console.error(`Error getting competencies for model ${modelId}:`, error);
      throw error;
    }
  }

  async createCompetency(data: InsertCompetency): Promise<Competency> {
    try {
      const result = await db.insert(competencies).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating competency:", error);
      throw error;
    }
  }

  async updateCompetency(id: string, data: Partial<InsertCompetency>): Promise<Competency> {
    try {
      const result = await db
        .update(competencies)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(competencies.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating competency ${id}:`, error);
      throw error;
    }
  }

  async deleteCompetency(id: string): Promise<void> {
    try {
      await db.delete(competencies).where(eq(competencies.id, id));
    } catch (error) {
      console.error(`Error deleting competency ${id}:`, error);
      throw error;
    }
  }

  // ==============================================
  // EVALUATION CYCLES
  // ==============================================

  async getEvaluationCycles(filters?: { status?: string; year?: number }): Promise<EvaluationCycle[]> {
    try {
      const conditions = [];
      if (filters?.status) {
        conditions.push(eq(evaluationCycles.status, filters.status));
      }
      if (filters?.year) {
        conditions.push(eq(evaluationCycles.year, filters.year));
      }

      if (conditions.length > 0) {
        return await db.select().from(evaluationCycles).where(and(...conditions)).orderBy(desc(evaluationCycles.year));
      }
      return await db.select().from(evaluationCycles).orderBy(desc(evaluationCycles.year));
    } catch (error) {
      console.error("Error getting evaluation cycles:", error);
      throw error;
    }
  }

  async getEvaluationCycle(id: string): Promise<EvaluationCycle | undefined> {
    try {
      const result = await db.select().from(evaluationCycles).where(eq(evaluationCycles.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error(`Error getting evaluation cycle ${id}:`, error);
      throw error;
    }
  }

  async getActiveCycle(): Promise<EvaluationCycle | undefined> {
    try {
      const result = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.status, "active"))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting active evaluation cycle:", error);
      throw error;
    }
  }

  async createEvaluationCycle(data: InsertEvaluationCycle): Promise<EvaluationCycle> {
    try {
      const result = await db.insert(evaluationCycles).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating evaluation cycle:", error);
      throw error;
    }
  }

  async updateEvaluationCycle(id: string, data: Partial<InsertEvaluationCycle>): Promise<EvaluationCycle> {
    try {
      const result = await db
        .update(evaluationCycles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(evaluationCycles.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating evaluation cycle ${id}:`, error);
      throw error;
    }
  }

  async updateEvaluationCycleStatus(id: string, status: string): Promise<EvaluationCycle> {
    try {
      const result = await db
        .update(evaluationCycles)
        .set({ status, updatedAt: new Date() })
        .where(eq(evaluationCycles.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating evaluation cycle status ${id}:`, error);
      throw error;
    }
  }

  async deleteEvaluationCycle(id: string): Promise<void> {
    try {
      await db.delete(evaluationCycles).where(eq(evaluationCycles.id, id));
    } catch (error) {
      console.error(`Error deleting evaluation cycle ${id}:`, error);
      throw error;
    }
  }

  // ==============================================
  // SELF ASSESSMENTS
  // ==============================================

  async getSelfAssessments(cycleId: string, userId: string): Promise<(SelfAssessment & { competency: Competency })[]> {
    try {
      const result = await db
        .select({
          selfAssessment: selfAssessments,
          competency: competencies,
        })
        .from(selfAssessments)
        .leftJoin(competencies, eq(selfAssessments.competencyId, competencies.id))
        .where(and(eq(selfAssessments.cycleId, cycleId), eq(selfAssessments.userId, userId)));

      return result.map((row) => ({
        ...row.selfAssessment,
        competency: row.competency!,
      }));
    } catch (error) {
      console.error("Error getting self assessments:", error);
      throw error;
    }
  }

  async createOrUpdateSelfAssessment(data: InsertSelfAssessment): Promise<SelfAssessment> {
    try {
      // Check if assessment already exists
      const existing = await db
        .select()
        .from(selfAssessments)
        .where(
          and(
            eq(selfAssessments.cycleId, data.cycleId),
            eq(selfAssessments.userId, data.userId),
            eq(selfAssessments.competencyId, data.competencyId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        const result = await db
          .update(selfAssessments)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(selfAssessments.id, existing[0].id))
          .returning();
        return result[0];
      } else {
        // Create new
        const result = await db.insert(selfAssessments).values(data).returning();
        return result[0];
      }
    } catch (error) {
      console.error("Error creating/updating self assessment:", error);
      throw error;
    }
  }

  async submitSelfAssessments(cycleId: string, userId: string): Promise<void> {
    try {
      await db
        .update(selfAssessments)
        .set({ submittedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(selfAssessments.cycleId, cycleId), eq(selfAssessments.userId, userId)));
    } catch (error) {
      console.error("Error submitting self assessments:", error);
      throw error;
    }
  }

  // ==============================================
  // PEER FEEDBACK REQUESTS
  // ==============================================

  async createPeerFeedbackRequest(
    cycleId: string,
    requestorId: string,
    peerIds: string[]
  ): Promise<PeerFeedbackRequest[]> {
    try {
      const requests = peerIds.map((peerId) => ({
        cycleId,
        requestorUserId: requestorId,
        peerUserId: peerId,
        status: "pending" as const,
      }));

      const result = await db.insert(peerFeedbackRequests).values(requests).returning();
      return result;
    } catch (error) {
      console.error("Error creating peer feedback requests:", error);
      throw error;
    }
  }

  async getPeerFeedbackRequests(cycleId: string, userId: string, type: "sent" | "received"): Promise<(PeerFeedbackRequest & { user: User })[]> {
    try {
      const userField = type === "sent" ? peerFeedbackRequests.peerUserId : peerFeedbackRequests.requestorUserId;

      const result = await db
        .select({
          request: peerFeedbackRequests,
          user: users,
        })
        .from(peerFeedbackRequests)
        .leftJoin(users, eq(userField, users.id))
        .where(
          and(
            eq(peerFeedbackRequests.cycleId, cycleId),
            type === "sent"
              ? eq(peerFeedbackRequests.requestorUserId, userId)
              : eq(peerFeedbackRequests.peerUserId, userId)
          )
        );

      return result.map((row) => ({
        ...row.request,
        user: row.user!,
      }));
    } catch (error) {
      console.error("Error getting peer feedback requests:", error);
      throw error;
    }
  }

  async updatePeerFeedbackRequestStatus(requestId: string, status: string): Promise<PeerFeedbackRequest> {
    try {
      const result = await db
        .update(peerFeedbackRequests)
        .set({ status, completedAt: status === "completed" ? new Date() : null, updatedAt: new Date() })
        .where(eq(peerFeedbackRequests.id, requestId))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating peer feedback request status:", error);
      throw error;
    }
  }

  // ==============================================
  // PEER FEEDBACKS
  // ==============================================

  async createPeerFeedback(data: InsertPeerFeedback): Promise<PeerFeedback> {
    try {
      const result = await db.insert(peerFeedbacks).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating peer feedback:", error);
      throw error;
    }
  }

  async getPeerFeedbacksByRequest(requestId: string): Promise<(PeerFeedback & { competency: Competency })[]> {
    try {
      const result = await db
        .select({
          feedback: peerFeedbacks,
          competency: competencies,
        })
        .from(peerFeedbacks)
        .leftJoin(competencies, eq(peerFeedbacks.competencyId, competencies.id))
        .where(eq(peerFeedbacks.requestId, requestId));

      return result.map((row) => ({
        ...row.feedback,
        competency: row.competency!,
      }));
    } catch (error) {
      console.error("Error getting peer feedbacks by request:", error);
      throw error;
    }
  }

  async getAggregatedPeerFeedback(
    cycleId: string,
    requestorUserId: string
  ): Promise<{ competencyId: string; competencyName: string; avgRating: number; comments: string[] }[]> {
    try {
      // Get all feedbacks for this user (anonymous)
      const feedbacks = await db
        .select({
          feedback: peerFeedbacks,
          competency: competencies,
        })
        .from(peerFeedbacks)
        .leftJoin(competencies, eq(peerFeedbacks.competencyId, competencies.id))
        .where(and(eq(peerFeedbacks.cycleId, cycleId), eq(peerFeedbacks.requestorUserId, requestorUserId)));

      // Group by competency and aggregate
      const grouped = feedbacks.reduce((acc, row) => {
        const competencyId = row.feedback.competencyId;
        if (!acc[competencyId]) {
          acc[competencyId] = {
            competencyId,
            competencyName: row.competency?.name || "",
            ratings: [],
            comments: [],
          };
        }
        acc[competencyId].ratings.push(row.feedback.rating);
        acc[competencyId].comments.push(row.feedback.comment);
        return acc;
      }, {} as Record<string, { competencyId: string; competencyName: string; ratings: number[]; comments: string[] }>);

      // Calculate averages
      return Object.values(grouped).map((group) => ({
        competencyId: group.competencyId,
        competencyName: group.competencyName,
        avgRating: Math.round((group.ratings.reduce((sum, r) => sum + r, 0) / group.ratings.length) * 10) / 10,
        comments: group.comments,
      }));
    } catch (error) {
      console.error("Error getting aggregated peer feedback:", error);
      throw error;
    }
  }

  // ==============================================
  // MANAGER EVALUATIONS
  // ==============================================

  async getManagerEvaluations(
    cycleId: string,
    employeeUserId: string
  ): Promise<(ManagerEvaluation & { competency: Competency })[]> {
    try {
      const result = await db
        .select({
          evaluation: managerEvaluations,
          competency: competencies,
        })
        .from(managerEvaluations)
        .leftJoin(competencies, eq(managerEvaluations.competencyId, competencies.id))
        .where(and(eq(managerEvaluations.cycleId, cycleId), eq(managerEvaluations.employeeUserId, employeeUserId)));

      return result.map((row) => ({
        ...row.evaluation,
        competency: row.competency!,
      }));
    } catch (error) {
      console.error("Error getting manager evaluations:", error);
      throw error;
    }
  }

  async createOrUpdateManagerEvaluation(data: InsertManagerEvaluation): Promise<ManagerEvaluation> {
    try {
      // Check if evaluation already exists
      const existing = await db
        .select()
        .from(managerEvaluations)
        .where(
          and(
            eq(managerEvaluations.cycleId, data.cycleId),
            eq(managerEvaluations.employeeUserId, data.employeeUserId),
            eq(managerEvaluations.competencyId, data.competencyId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        const result = await db
          .update(managerEvaluations)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(managerEvaluations.id, existing[0].id))
          .returning();
        return result[0];
      } else {
        // Create new
        const result = await db.insert(managerEvaluations).values(data).returning();
        return result[0];
      }
    } catch (error) {
      console.error("Error creating/updating manager evaluation:", error);
      throw error;
    }
  }

  async submitManagerEvaluations(cycleId: string, employeeUserId: string, managerUserId: string): Promise<void> {
    try {
      await db
        .update(managerEvaluations)
        .set({ submittedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(managerEvaluations.cycleId, cycleId),
            eq(managerEvaluations.employeeUserId, employeeUserId),
            eq(managerEvaluations.managerUserId, managerUserId)
          )
        );
    } catch (error) {
      console.error("Error submitting manager evaluations:", error);
      throw error;
    }
  }

  // ==============================================
  // DEVELOPMENT PLANS
  // ==============================================

  async getDevelopmentPlan(cycleId: string, employeeUserId: string): Promise<DevelopmentPlan | undefined> {
    try {
      const result = await db
        .select()
        .from(developmentPlans)
        .where(and(eq(developmentPlans.cycleId, cycleId), eq(developmentPlans.employeeUserId, employeeUserId)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting development plan:", error);
      throw error;
    }
  }

  async getDevelopmentPlansByManager(cycleId: string, managerUserId: string): Promise<(DevelopmentPlan & { employee: User })[]> {
    try {
      const result = await db
        .select({
          plan: developmentPlans,
          employee: users,
        })
        .from(developmentPlans)
        .leftJoin(users, eq(developmentPlans.employeeUserId, users.id))
        .where(and(eq(developmentPlans.cycleId, cycleId), eq(developmentPlans.managerUserId, managerUserId)));

      return result.map((row) => ({
        ...row.plan,
        employee: row.employee!,
      }));
    } catch (error) {
      console.error("Error getting development plans by manager:", error);
      throw error;
    }
  }

  async createDevelopmentPlan(data: InsertDevelopmentPlan): Promise<DevelopmentPlan> {
    try {
      const result = await db.insert(developmentPlans).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating development plan:", error);
      throw error;
    }
  }

  async updateDevelopmentPlan(id: string, data: Partial<InsertDevelopmentPlan>): Promise<DevelopmentPlan> {
    try {
      const result = await db
        .update(developmentPlans)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(developmentPlans.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating development plan ${id}:`, error);
      throw error;
    }
  }

  async updateDevelopmentPlanStatus(id: string, status: string): Promise<DevelopmentPlan> {
    try {
      const result = await db
        .update(developmentPlans)
        .set({ status, updatedAt: new Date() })
        .where(eq(developmentPlans.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating development plan status ${id}:`, error);
      throw error;
    }
  }

  async deleteDevelopmentPlan(id: string): Promise<void> {
    try {
      await db.delete(developmentPlans).where(eq(developmentPlans.id, id));
    } catch (error) {
      console.error(`Error deleting development plan ${id}:`, error);
      throw error;
    }
  }

  // ==============================================
  // NOTIFICATIONS
  // ==============================================

  async createNotification(data: InsertEvaluationNotification): Promise<EvaluationNotification> {
    try {
      const result = await db.insert(evaluationNotifications).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async getNotifications(userId: string, cycleId?: string): Promise<EvaluationNotification[]> {
    try {
      const conditions = [eq(evaluationNotifications.userId, userId)];
      if (cycleId) {
        conditions.push(eq(evaluationNotifications.cycleId, cycleId));
      }

      return await db
        .select()
        .from(evaluationNotifications)
        .where(and(...conditions))
        .orderBy(desc(evaluationNotifications.sentAt));
    } catch (error) {
      console.error("Error getting notifications:", error);
      throw error;
    }
  }

  async markNotificationAsRead(id: string): Promise<EvaluationNotification> {
    try {
      const result = await db
        .update(evaluationNotifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(evaluationNotifications.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  }

  // ==============================================
  // ANALYTICS
  // ==============================================

  async getCompetenciesOverview(cycleId: string): Promise<{
    totalSelfAssessments: number;
    completedSelfAssessments: number;
    totalManagerEvaluations: number;
    completedManagerEvaluations: number;
    totalDevelopmentPlans: number;
    avgSelfRating: number;
    avgManagerRating: number;
    avgPeerRating: number;
  }> {
    try {
      // Count self assessments
      const selfCount = await db
        .select({ count: count() })
        .from(selfAssessments)
        .where(eq(selfAssessments.cycleId, cycleId));

      const selfCompleted = await db
        .select({ count: count() })
        .from(selfAssessments)
        .where(and(eq(selfAssessments.cycleId, cycleId), sql`${selfAssessments.submittedAt} IS NOT NULL`));

      // Count manager evaluations
      const managerCount = await db
        .select({ count: count() })
        .from(managerEvaluations)
        .where(eq(managerEvaluations.cycleId, cycleId));

      const managerCompleted = await db
        .select({ count: count() })
        .from(managerEvaluations)
        .where(and(eq(managerEvaluations.cycleId, cycleId), sql`${managerEvaluations.submittedAt} IS NOT NULL`));

      // Count development plans
      const plansCount = await db
        .select({ count: count() })
        .from(developmentPlans)
        .where(eq(developmentPlans.cycleId, cycleId));

      // Average ratings
      const avgSelf = await db
        .select({ avg: avg(selfAssessments.rating) })
        .from(selfAssessments)
        .where(eq(selfAssessments.cycleId, cycleId));

      const avgManager = await db
        .select({ avg: avg(managerEvaluations.rating) })
        .from(managerEvaluations)
        .where(eq(managerEvaluations.cycleId, cycleId));

      const avgPeer = await db
        .select({ avg: avg(peerFeedbacks.rating) })
        .from(peerFeedbacks)
        .where(eq(peerFeedbacks.cycleId, cycleId));

      return {
        totalSelfAssessments: selfCount[0]?.count || 0,
        completedSelfAssessments: selfCompleted[0]?.count || 0,
        totalManagerEvaluations: managerCount[0]?.count || 0,
        completedManagerEvaluations: managerCompleted[0]?.count || 0,
        totalDevelopmentPlans: plansCount[0]?.count || 0,
        avgSelfRating: Math.round((parseFloat(String(avgSelf[0]?.avg || 0)) || 0) * 10) / 10,
        avgManagerRating: Math.round((parseFloat(String(avgManager[0]?.avg || 0)) || 0) * 10) / 10,
        avgPeerRating: Math.round((parseFloat(String(avgPeer[0]?.avg || 0)) || 0) * 10) / 10,
      };
    } catch (error) {
      console.error("Error getting competencies overview:", error);
      throw error;
    }
  }

  async getRatingsDistribution(cycleId: string): Promise<{
    selfAssessments: Record<number, number>;
    managerEvaluations: Record<number, number>;
    peerFeedbacks: Record<number, number>;
  }> {
    try {
      // Get all ratings for each type
      const selfRatings = await db
        .select({ rating: selfAssessments.rating })
        .from(selfAssessments)
        .where(eq(selfAssessments.cycleId, cycleId));

      const managerRatings = await db
        .select({ rating: managerEvaluations.rating })
        .from(managerEvaluations)
        .where(eq(managerEvaluations.cycleId, cycleId));

      const peerRatings = await db
        .select({ rating: peerFeedbacks.rating })
        .from(peerFeedbacks)
        .where(eq(peerFeedbacks.cycleId, cycleId));

      // Count distribution
      const countDistribution = (ratings: { rating: number }[]) => {
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach((r) => {
          dist[r.rating] = (dist[r.rating] || 0) + 1;
        });
        return dist;
      };

      return {
        selfAssessments: countDistribution(selfRatings),
        managerEvaluations: countDistribution(managerRatings),
        peerFeedbacks: countDistribution(peerRatings),
      };
    } catch (error) {
      console.error("Error getting ratings distribution:", error);
      throw error;
    }
  }

  // ==============================================
  // ADDITIONAL HELPER METHODS
  // ==============================================

  async getCompetenciesForPersona(personaType: string): Promise<Competency[]> {
    try {
      // Get all models for this persona type
      const models = await db
        .select()
        .from(competencyModels)
        .where(
          and(
            eq(competencyModels.personaType, personaType),
            eq(competencyModels.isActive, true)
          )
        );

      if (models.length === 0) {
        return [];
      }

      const modelIds = models.map(m => m.id);

      // Get all competencies for these models, including transversal ones
      const competenciesList = await db
        .select()
        .from(competencies)
        .where(
          inArray(competencies.modelId, modelIds)
        )
        .orderBy(competencies.displayOrder, competencies.name);

      return competenciesList;
    } catch (error) {
      console.error("Error getting competencies for persona:", error);
      throw error;
    }
  }

  async getTeamMembers(managerId: string): Promise<User[]> {
    try {
      // Get all users who report to this manager
      const teamMembers = await db
        .select()
        .from(users)
        .where(eq(users.managerId, managerId));

      return teamMembers;
    } catch (error) {
      console.error("Error getting team members:", error);
      throw error;
    }
  }

  async getDevelopmentPlanById(id: string): Promise<DevelopmentPlan | undefined> {
    try {
      const plan = await db
        .select()
        .from(developmentPlans)
        .where(eq(developmentPlans.id, id))
        .limit(1);

      return plan[0];
    } catch (error) {
      console.error("Error getting development plan by id:", error);
      throw error;
    }
  }

  // ==============================================
  // USER COMPETENCY MODEL ASSIGNMENTS
  // ==============================================

  async getUserCompetencyModelAssignments(userId: string): Promise<(UserCompetencyModelAssignment & { competencyModel: CompetencyModel })[]> {
    try {
      const assignments = await db
        .select({
          id: userCompetencyModelAssignments.id,
          userId: userCompetencyModelAssignments.userId,
          competencyModelId: userCompetencyModelAssignments.competencyModelId,
          assignedAt: userCompetencyModelAssignments.assignedAt,
          assignedBy: userCompetencyModelAssignments.assignedBy,
          validFrom: userCompetencyModelAssignments.validFrom,
          validTo: userCompetencyModelAssignments.validTo,
          isCurrent: userCompetencyModelAssignments.isCurrent,
          notes: userCompetencyModelAssignments.notes,
          createdAt: userCompetencyModelAssignments.createdAt,
          updatedAt: userCompetencyModelAssignments.updatedAt,
          competencyModel: competencyModels,
        })
        .from(userCompetencyModelAssignments)
        .leftJoin(competencyModels, eq(userCompetencyModelAssignments.competencyModelId, competencyModels.id))
        .where(eq(userCompetencyModelAssignments.userId, userId))
        .orderBy(desc(userCompetencyModelAssignments.assignedAt));

      return assignments as (UserCompetencyModelAssignment & { competencyModel: CompetencyModel })[];
    } catch (error) {
      console.error("Error getting user competency model assignments:", error);
      throw error;
    }
  }

  async getCurrentUserCompetencyModelAssignment(userId: string): Promise<(UserCompetencyModelAssignment & { competencyModel: CompetencyModel }) | undefined> {
    try {
      const assignment = await db
        .select({
          id: userCompetencyModelAssignments.id,
          userId: userCompetencyModelAssignments.userId,
          competencyModelId: userCompetencyModelAssignments.competencyModelId,
          assignedAt: userCompetencyModelAssignments.assignedAt,
          assignedBy: userCompetencyModelAssignments.assignedBy,
          validFrom: userCompetencyModelAssignments.validFrom,
          validTo: userCompetencyModelAssignments.validTo,
          isCurrent: userCompetencyModelAssignments.isCurrent,
          notes: userCompetencyModelAssignments.notes,
          createdAt: userCompetencyModelAssignments.createdAt,
          updatedAt: userCompetencyModelAssignments.updatedAt,
          competencyModel: competencyModels,
        })
        .from(userCompetencyModelAssignments)
        .leftJoin(competencyModels, eq(userCompetencyModelAssignments.competencyModelId, competencyModels.id))
        .where(
          and(
            eq(userCompetencyModelAssignments.userId, userId),
            eq(userCompetencyModelAssignments.isCurrent, true)
          )
        )
        .limit(1);

      return assignment[0] as (UserCompetencyModelAssignment & { competencyModel: CompetencyModel }) | undefined;
    } catch (error) {
      console.error("Error getting current user competency model assignment:", error);
      throw error;
    }
  }

  async createUserCompetencyModelAssignment(data: InsertUserCompetencyModelAssignment): Promise<UserCompetencyModelAssignment> {
    try {
      // If this is marked as current, set all other assignments for this user to not current
      if (data.isCurrent) {
        await db
          .update(userCompetencyModelAssignments)
          .set({ isCurrent: false, updatedAt: new Date() })
          .where(eq(userCompetencyModelAssignments.userId, data.userId));
      }

      const [assignment] = await db
        .insert(userCompetencyModelAssignments)
        .values(data)
        .returning();

      return assignment;
    } catch (error) {
      console.error("Error creating user competency model assignment:", error);
      throw error;
    }
  }

  async updateUserCompetencyModelAssignment(id: string, data: Partial<InsertUserCompetencyModelAssignment>): Promise<UserCompetencyModelAssignment | undefined> {
    try {
      // If updating to current, set all other assignments for this user to not current
      if (data.isCurrent) {
        const existing = await db
          .select()
          .from(userCompetencyModelAssignments)
          .where(eq(userCompetencyModelAssignments.id, id))
          .limit(1);

        if (existing[0]) {
          await db
            .update(userCompetencyModelAssignments)
            .set({ isCurrent: false, updatedAt: new Date() })
            .where(eq(userCompetencyModelAssignments.userId, existing[0].userId));
        }
      }

      const [assignment] = await db
        .update(userCompetencyModelAssignments)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userCompetencyModelAssignments.id, id))
        .returning();

      return assignment;
    } catch (error) {
      console.error("Error updating user competency model assignment:", error);
      throw error;
    }
  }

  async deleteUserCompetencyModelAssignment(id: string): Promise<void> {
    try {
      await db
        .delete(userCompetencyModelAssignments)
        .where(eq(userCompetencyModelAssignments.id, id));
    } catch (error) {
      console.error("Error deleting user competency model assignment:", error);
      throw error;
    }
  }

  // ==============================================
  // OVERALL SELF ASSESSMENTS
  // ==============================================

  async getOverallSelfAssessment(cycleId: string, userId: string): Promise<OverallSelfAssessment | undefined> {
    try {
      const result = await db
        .select()
        .from(overallSelfAssessments)
        .where(and(
          eq(overallSelfAssessments.cycleId, cycleId),
          eq(overallSelfAssessments.userId, userId)
        ))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error(`Error getting overall self assessment for cycle ${cycleId} and user ${userId}:`, error);
      throw error;
    }
  }

  async createOrUpdateOverallSelfAssessment(data: InsertOverallSelfAssessment): Promise<OverallSelfAssessment> {
    try {
      // Check if assessment already exists
      const existing = await this.getOverallSelfAssessment(data.cycleId, data.userId);

      if (existing) {
        // Update existing assessment
        const [updated] = await db
          .update(overallSelfAssessments)
          .set({
            ...data,
            updatedAt: new Date(),
            // Don't change submittedAt unless explicitly provided
            submittedAt: data.submittedAt ?? existing.submittedAt
          })
          .where(eq(overallSelfAssessments.id, existing.id))
          .returning();
        return updated;
      } else {
        // Create new assessment
        const [created] = await db
          .insert(overallSelfAssessments)
          .values(data)
          .returning();
        return created;
      }
    } catch (error) {
      console.error("Error creating or updating overall self assessment:", error);
      throw error;
    }
  }

  async submitOverallSelfAssessment(cycleId: string, userId: string): Promise<void> {
    try {
      const existing = await this.getOverallSelfAssessment(cycleId, userId);
      if (!existing) {
        throw new Error("Overall self assessment not found");
      }

      await db
        .update(overallSelfAssessments)
        .set({
          submittedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(overallSelfAssessments.id, existing.id));
    } catch (error) {
      console.error(`Error submitting overall self assessment for cycle ${cycleId} and user ${userId}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const competenciesStorage = new CompetenciesStorage();
