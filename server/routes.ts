// Integration: javascript_log_in_with_replit
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { competenciesStorage } from "./competenciesStorage";
import { seed } from "./seed";
import { db } from "./db";
import {
  sedi,
  ccnl,
  livelliContrattuali,
  categorieProtette,
  configurazioniOrario,
  causaliAssunzione,
  persona,
  contatti,
  organizzazione,
  contratti,
  compensation,
  ruoli,
  smartWorkingStorico
} from "@shared/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";

// Use local auth in development and Railway production (disable Replit auth)
// Replit OAuth is not available in Railway deployment
const authModule = await import("./localAuth");

const { setupAuth, isAuthenticated, isAdmin } = authModule;
import {
  insertIndicatorClusterSchema,
  insertCalculationTypeSchema,
  insertBusinessFunctionSchema,
  insertObjectivesDictionarySchema,
  insertObjectiveSchema,
  insertObjectiveAssignmentSchema,
  insertDocumentSchema,
  insertDocumentAcceptanceSchema,
  upsertUserSchema,
  insertCustomFieldDefinitionSchema,
  insertCustomFieldValueSchema,
  insertCompetencyModelSchema,
  insertCompetencySchema,
  insertEvaluationCycleSchema,
  insertSelfAssessmentSchema,
  insertOverallSelfAssessmentSchema,
  insertPeerFeedbackRequestSchema,
  insertPeerFeedbackSchema,
  insertManagerEvaluationSchema,
  insertDevelopmentPlanSchema,
  insertEvaluationNotificationSchema,
  insertUserCompetencyModelAssignmentSchema,
  insertSediSchema,
  insertCcnlSchema,
  insertLivelliContrattualiSchema,
  insertCategorieProtetteSchema,
  insertConfigurazioniOrarioSchema,
  insertCausaliAssunzioneSchema,
  insertPersonaSchema,
  insertContattiSchema,
  insertOrganizzazioneSchema,
  insertContrattiSchema,
  insertCompensationSchema,
  insertRuoliSchema,
  insertSmartWorkingStoricoSchema,
} from "@shared/schema";
import { ZodError } from "zod";

// Helper to get user ID from request
function getUserId(req: Request): string {
  // Check for demo mode header first
  if (req.headers["x-demo-user-id"]) {
    return req.headers["x-demo-user-id"] as string;
  }
  // For local auth, user ID is directly in req.user.id
  // For Replit auth, it's in req.user.claims.sub
  return (req.user as any)?.id || (req.user as any)?.claims?.sub;
}

// Helper for error handling
function handleError(res: any, error: unknown) {
  try {
    console.error("Error:", error instanceof Error ? error.message : String(error));
  } catch (e) {
    console.error("Error occurred (logging failed)");
  }
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Validation error", errors: error.errors });
  }
  res.status(500).json({ message: "Internal server error" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Health check - no auth required (used for deployment health checks)
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Admin endpoint to manually seed database if needed
  app.post("/api/admin/seed", isAdmin, async (req, res) => {
    // Seeding disabled - use direct SQL instead
    res.status(403).json({ message: "Seeding is disabled. Use direct SQL for manual database operations." });
  });

  // Demo login - for testing (sets session storage on client)
  app.get("/api/demo-login/:role", async (req, res) => {
    try {
      const role = req.params.role as "admin" | "employee";
      if (!["admin", "employee"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Create demo user in database
      const demoUserId = role === "admin" ? "demo-admin-001" : "demo-employee-001";
      
      // Check if user already exists to preserve RAL and mboPercentage
      const existingUser = await storage.getUser(demoUserId);
      const ralToUse = existingUser?.ral ? parseFloat(String(existingUser.ral)) : (role === "admin" ? undefined : 80000);
      const mboToUse = existingUser?.mboPercentage ?? 25;
      
      await storage.upsertUser({
        id: demoUserId,
        email: `${role}@demo.local`,
        firstName: role === "admin" ? "Admin" : "Dipendente",
        lastName: "Demo",
        profileImageUrl: undefined,
        department: role === "admin" ? "Management" : "IT Development",
        ral: ralToUse,
        mboPercentage: mboToUse,
      });

      // For demo employee, assign some objectives (with weight validation)
      if (role === "employee") {
        try {
          // Get first few objectives (from objectives table, not dictionary) to assign
          const objectives = await storage.getObjectives();
          if (objectives.length > 0) {
            // Check existing assignments to not exceed 100%
            const existingAssignments = await storage.getObjectiveAssignments(demoUserId);
            let currentTotalWeight = existingAssignments.reduce((sum, a) => sum + (a.weight || 0), 0);
            const defaultWeight = 20;
            
            // Assign objectives only if weight allows (max 5 objectives at 20% each = 100%)
            for (let i = 0; i < Math.min(5, objectives.length) && currentTotalWeight + defaultWeight <= 100; i++) {
              const objective = objectives[i];
              
              // Check if already assigned
              const alreadyAssigned = existingAssignments.some(a => a.objectiveId === objective.id);
              if (alreadyAssigned) continue;
              
              try {
                await storage.createObjectiveAssignment({
                  userId: demoUserId,
                  objectiveId: objective.id,
                  status: "in_progress",
                  progress: Math.floor(Math.random() * 80),
                  weight: defaultWeight,
                });
                currentTotalWeight += defaultWeight;
              } catch (e) {
                // Ignore if assignment already exists or other errors
              }
            }
          }
        } catch (e) {
          console.error("Assignment error:", e);
          // Ignore assignment errors - it's not critical for demo
        }
      }

      // Return HTML that sets sessionStorage and redirects
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Demo Login</title></head>
        <body>
          <script>
            sessionStorage.setItem('demo_mode', 'true');
            sessionStorage.setItem('demo_role', '${role}');
            window.location.href = '/';
          </script>
        </body>
        </html>
      `;
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized - no user ID" });
      }
      
      // In demo mode, create the user if it doesn't exist
      if (req.headers["x-demo-mode"] === "true") {
        const demoRole = req.headers["x-demo-role"] as string;
        const existingUser = await storage.getUser(userId);
        
        if (!existingUser) {
          // Create demo user
          await storage.upsertUser({
            id: userId,
            email: `${demoRole}@demo.local`,
            firstName: demoRole === "admin" ? "Admin" : "Dipendente",
            lastName: "Demo",
            profileImageUrl: null,
            department: demoRole === "admin" ? "Management" : "IT Development",
            ral: demoRole === "admin" ? null : 80000,
            mboPercentage: 25,
          });
        } else {
          // User exists, just ensure demo fields are set but preserve RAL and mboPercentage
          if (!existingUser.ral && demoRole === "employee") {
            await storage.updateUser(userId, { ral: 80000 });
          }
        }
      }
      
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update current user's profile (name, phone, address, etc.)
  app.post("/api/auth/profile", isAuthenticated, async (req, res) => {
    try {
      console.log("Profile update request received");
      console.log("User session:", (req.user as any)?.id);
      
      const userId = getUserId(req);
      console.log("Extracted userId:", userId);
      
      if (!userId) {
        console.error("No user ID found");
        return res.status(401).json({ message: "Unauthorized - no user ID" });
      }

      // Only allow updating specific personal fields
      const allowedFields = ["firstName", "lastName", "telefono", "indirizzo", "cap", "citta"];
      const updateData: any = {};
      
      for (const field of allowedFields) {
        if (field in req.body) {
          updateData[field] = req.body[field];
        }
      }

      console.log("Data to update:", updateData);

      // Validate the data
      const validatedData = upsertUserSchema.partial().parse(updateData);
      console.log("Validated data:", validatedData);
      
      // Update user
      const user = await storage.updateUser(userId, validatedData);
      console.log("User updated successfully:", user);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Profile update error:", error);
      handleError(res, error);
    }
  });

  // Get current user's team context (manager, colleagues, direct reports) - accessible to all authenticated users
  app.get("/api/my-team", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const currentUser = await storage.getUser(userId);
      if (!currentUser) return res.status(404).json({ message: "User not found" });

      const allUsers = await storage.getAllUsers();

      const manager = currentUser.managerId
        ? allUsers.find((u) => u.id === currentUser.managerId) ?? null
        : null;

      const colleagues = currentUser.managerId
        ? allUsers.filter((u) => u.managerId === currentUser.managerId && u.id !== userId && u.isActive)
        : [];

      const directReports = allUsers.filter((u) => u.managerId === userId && u.isActive);

      res.json({ manager, colleagues, directReports });
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team data" });
    }
  });

  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      // If pagination params are provided, use paginated endpoint
      if (page || limit) {
        const result = await storage.getAllUsersPaginated({ page, limit });
        res.json(result);
      } else {
        // Backward compatibility: no params = return all users
        const users = await storage.getAllUsers();
        res.json(users);
      }
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update user (admin only - for org chart editing)
  app.patch("/api/users/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { department, managerId } = req.body;

      // Validate that user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent circular manager relationships
      if (managerId && managerId !== null) {
        // Check if the new manager would create a cycle
        let currentManagerId = managerId;
        const visited = new Set<string>([userId]);

        while (currentManagerId) {
          if (visited.has(currentManagerId)) {
            return res.status(400).json({
              message: "Invalid manager assignment: would create a circular hierarchy"
            });
          }
          visited.add(currentManagerId);

          const manager = await storage.getUser(currentManagerId);
          if (!manager) break;
          currentManagerId = manager.managerId || null;
        }
      }

      // Update user with new department and/or manager
      await storage.updateUser(userId, {
        department: department !== undefined ? department : user.department,
        managerId: managerId !== undefined ? managerId : user.managerId,
      });

      // Fetch updated user
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("User update error:", error);
      handleError(res, error);
    }
  });

  // Org chart endpoint with hybrid access (admin sees all, employees see their team)
  app.get("/api/orgchart", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized - no user ID" });
      }

      // Recupera utente corrente per verificare il ruolo
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isAdmin = user.role === "admin";

      // Recupera utenti filtrati in base al ruolo
      const users = await storage.getOrgChartUsers(userId, isAdmin);

      // Mappa a DTO per escludere campi sensibili
      const dtoUsers = users.map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        department: u.department,
        managerId: u.managerId,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        location: u.location,
        businessFunction: u.businessFunction,
      }));

      // Ritorna dati con metadata
      res.json({
        users: dtoUsers,
        metadata: {
          isFiltered: !isAdmin,
          totalVisible: dtoUsers.length,
          viewerRole: user.role,
        }
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = upsertUserSchema.parse(req.body);
      const user = await storage.upsertUser(data);
      res.status(201).json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = upsertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, data);
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Indicator Clusters routes
  app.get("/api/indicator-clusters", isAuthenticated, async (req, res) => {
    try {
      const clusters = await storage.getIndicatorClusters();
      res.json(clusters);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/indicator-clusters", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertIndicatorClusterSchema.parse(req.body);
      const cluster = await storage.createIndicatorCluster(data);
      res.status(201).json(cluster);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/indicator-clusters/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertIndicatorClusterSchema.partial().parse(req.body);
      const cluster = await storage.updateIndicatorCluster(req.params.id, data);
      res.json(cluster);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/indicator-clusters/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteIndicatorCluster(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Calculation Types routes
  app.get("/api/calculation-types", isAuthenticated, async (req, res) => {
    try {
      const types = await storage.getCalculationTypes();
      res.json(types);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/calculation-types", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertCalculationTypeSchema.parse(req.body);
      const type = await storage.createCalculationType(data);
      res.status(201).json(type);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/calculation-types/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertCalculationTypeSchema.partial().parse(req.body);
      const type = await storage.updateCalculationType(req.params.id, data);
      res.json(type);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/calculation-types/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCalculationType(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error?.code === "SQLITE_CONSTRAINT_FOREIGNKEY" || error?.message?.includes("FOREIGN KEY")) {
        return res.status(400).json({ message: "Impossibile eliminare: questo tipo di calcolo è usato da uno o più obiettivi nel dizionario." });
      }
      handleError(res, error);
    }
  });

  // Business Functions routes
  app.get("/api/business-functions", isAuthenticated, async (req, res) => {
    try {
      const functions = await storage.getBusinessFunctions();
      res.json(functions);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/business-functions/:id", isAuthenticated, async (req, res) => {
    try {
      const business = await storage.getBusinessFunction(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business function not found" });
      }
      res.json(business);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/business-functions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertBusinessFunctionSchema.parse(req.body);
      const business = await storage.createBusinessFunction(data);
      res.status(201).json(business);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/business-functions/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertBusinessFunctionSchema.partial().parse(req.body);
      const business = await storage.updateBusinessFunction(req.params.id, data);
      res.json(business);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/business-functions/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteBusinessFunction(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Objectives Dictionary routes
  app.get("/api/objectives-dictionary", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getObjectivesDictionary();
      res.json(items);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/objectives-dictionary/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.getObjectivesDictionaryItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Objective dictionary item not found" });
      }
      res.json(item);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/objectives-dictionary", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertObjectivesDictionarySchema.parse(req.body);
      const item = await storage.createObjectivesDictionaryItem(data);
      res.status(201).json(item);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/objectives-dictionary/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertObjectivesDictionarySchema.partial().parse(req.body);
      const item = await storage.updateObjectivesDictionaryItem(req.params.id, data);
      res.json(item);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/objectives-dictionary/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteObjectivesDictionaryItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Objective routes
  app.get("/api/objectives", isAuthenticated, async (req, res) => {
    try {
      const objectives = await storage.getObjectives();
      res.json(objectives);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/objectives/:id", isAuthenticated, async (req, res) => {
    try {
      const objective = await storage.getObjective(req.params.id);
      if (!objective) {
        return res.status(404).json({ message: "Objective not found" });
      }
      res.json(objective);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/objectives", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertObjectiveSchema.parse(req.body);
      const objective = await storage.createObjective(data);
      res.status(201).json(objective);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/objectives/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertObjectiveSchema.partial().parse(req.body);
      const objective = await storage.updateObjective(req.params.id, data);
      res.json(objective);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/objectives/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteObjective(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Tabellone MBO — full plan view per eligible user
  app.get("/api/tabellone", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const eligibleUsers = allUsers.filter((u: any) => u.role === "employee" || u.role === "hr");

      const rows = [];
      for (const u of eligibleUsers) {
        const assignments = await storage.getObjectiveAssignments(u.id);
        if (assignments.length === 0) continue;

        const ral = parseFloat(String(u.ral || 0));
        const mboPerc = u.mboPercentage || 0;
        const mboTarget = ral * (mboPerc / 100);
        const totalWeight = assignments.reduce((s: number, a: any) => s + (a.weight || 0), 0);

        rows.push({
          user: {
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            codiceFiscale: u.codiceFiscale,
            department: u.department,
            livello: (u as any).livello || null,
            ral,
            mboPercentage: mboPerc,
            mboTarget,
          },
          totalWeight,
          objectives: assignments.map((a: any) => {
            const obj = a.objective as any;
            const weight = a.weight || 0;
            const objMboTarget = mboTarget * (weight / 100);
            return {
              assignmentId: a.id,
              title: obj?.title || "",
              description: obj?.description || "",
              targetDescription: obj?.targetDescription || "",
              dataSource: obj?.dataSource || "",
              clusterName: obj?.indicatorCluster?.name || "",
              calculationTypeName: obj?.calculationType?.name || "",
              thresholdValue: obj?.thresholdValue ?? null,
              thresholdPayout: obj?.thresholdPayout ?? 50,
              allowOverperformance: obj?.allowOverperformance ?? 0,
              maxPayout: obj?.maxPayout ?? null,
              targetValue: obj?.targetValue ?? null,
              actualValue: obj?.actualValue ?? null,
              qualitativeResult: obj?.qualitativeResult ?? null,
              weight,
              objMboTarget,
              progress: a.progress || 0,
              status: a.status,
            };
          }),
        });
      }

      res.json(rows);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get all objectives with their assigned users (for reporting)
  app.get("/api/objectives-with-assignments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const objectivesWithAssignments = await storage.getObjectivesWithAssignments();
      res.json(objectivesWithAssignments);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Report on a dictionary (updates all related objectives and assignments)
  app.patch("/api/dictionary/:id/report", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { actualValue, qualitativeResult } = req.body;
      const dictionary = await storage.getObjectivesDictionaryItem(req.params.id);

      if (!dictionary) {
        return res.status(404).json({ message: "Dictionary item not found" });
      }

      let calculatedProgress = 0;
      let finalActualValue: number | undefined = undefined;
      let finalQualitativeResult: string | undefined = undefined;

      if (actualValue !== undefined) {
        finalActualValue = actualValue;

        // For numeric objectives, auto-calculate qualitativeResult based on actualValue vs targetValue and thresholdValue
        if (dictionary.objectiveType === "numeric" && dictionary.targetValue !== null && dictionary.targetValue !== undefined) {
          const target = parseFloat(String(dictionary.targetValue));
          const actual = parseFloat(String(actualValue));
          const threshold = dictionary.thresholdValue ? parseFloat(String(dictionary.thresholdValue)) : null;

          const allowOverperformance = dictionary.allowOverperformance === 1;
          const maxPayout = dictionary.maxPayout ?? 120;
          const thresholdPayout = dictionary.thresholdPayout ?? 50;

          // If threshold is defined: below threshold = 0%, at threshold = thresholdPayout%, linear to 100% at target
          if (threshold !== null) {
            if (actual < threshold) {
              finalQualitativeResult = "not_reached";
              calculatedProgress = 0;
            } else if (actual > target && allowOverperformance) {
              // Overperformance: linear above target, capped at maxPayout
              finalQualitativeResult = "reached";
              const overshoot = ((actual - target) / target) * 100;
              calculatedProgress = Math.min(Math.round(100 + overshoot), maxPayout);
            } else if (actual >= target) {
              finalQualitativeResult = "reached";
              calculatedProgress = 100;
            } else {
              // Between threshold and target: interpolate from thresholdPayout% to 100%
              finalQualitativeResult = "partial";
              const t = (actual - threshold) / (target - threshold);
              calculatedProgress = Math.round(thresholdPayout + t * (100 - thresholdPayout));
            }
          } else {
            // No threshold
            if (actual > target && allowOverperformance) {
              finalQualitativeResult = "reached";
              const overshoot = ((actual - target) / target) * 100;
              calculatedProgress = Math.min(Math.round(100 + overshoot), maxPayout);
            } else if (actual >= target) {
              finalQualitativeResult = "reached";
              calculatedProgress = 100;
            } else {
              finalQualitativeResult = "not_reached";
              calculatedProgress = Math.round((actual / target) * 100);
            }
          }
        }
      }

      if (qualitativeResult && ["reached", "not_reached", "partial"].includes(qualitativeResult)) {
        // Only set qualitativeResult for qualitative objectives
        if (dictionary.objectiveType === "qualitative") {
          finalQualitativeResult = qualitativeResult;
          // Map qualitative result to progress
          if (qualitativeResult === "reached") {
            calculatedProgress = 100;
          } else if (qualitativeResult === "partial") {
            calculatedProgress = 50;
          } else {
            calculatedProgress = 0;
          }
        }
      }

      // Update dictionary and propagate to all objectives and assignments
      await storage.reportOnDictionary(req.params.id, {
        actualValue: finalActualValue,
        qualitativeResult: finalQualitativeResult,
        progress: calculatedProgress,
      });

      const updatedDictionary = await storage.getObjectivesDictionaryItem(req.params.id);
      res.json(updatedDictionary);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Objective Assignment routes
  app.get("/api/my-objectives", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const assignments = await storage.getObjectiveAssignments(userId);
      res.json(assignments);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/assignments/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const assignments = await storage.getObjectiveAssignments(req.params.userId);
      res.json(assignments);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/assignments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId, objectiveId, status, progress, weight, objectiveType, targetValue } = req.body;
      
      if (!userId || !objectiveId) {
        return res.status(400).json({ message: "userId and objectiveId are required" });
      }

      const assignmentWeight = weight || 20;

      // Check if total weight would exceed 100%
      const existingAssignments = await storage.getObjectiveAssignments(userId);
      const currentTotalWeight = existingAssignments.reduce((sum, a) => sum + (a.weight || 0), 0);
      
      if (currentTotalWeight + assignmentWeight > 100) {
        return res.status(400).json({ 
          message: `Impossibile assegnare: il peso totale supererebbe il 100%. Peso attuale: ${currentTotalWeight}%, nuovo peso: ${assignmentWeight}%, disponibile: ${100 - currentTotalWeight}%`
        });
      }

      // Get the dictionary item to retrieve clusterId
      const dictionaryItem = await storage.getObjectivesDictionaryItem(objectiveId);
      if (!dictionaryItem) {
        return res.status(404).json({ message: "Objective dictionary item not found" });
      }

      // Create an objective instance from dictionary with clusterId
      const objective = await storage.createObjective({
        dictionaryId: objectiveId,
        clusterId: dictionaryItem.indicatorClusterId,
        deadline: null,
      });

      // Create the assignment with the new objective
      const assignment = await storage.createObjectiveAssignment({
        userId,
        objectiveId: objective.id,
        status: status || "assegnato",
        progress: progress || 0,
        weight: assignmentWeight,
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Preview bulk assignment — returns which users would be skipped due to weight overflow
  app.get("/api/assignments/bulk-preview", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { objectiveId, department, weight } = req.query as Record<string, string>;
      if (!objectiveId || !department || !weight) {
        return res.status(400).json({ message: "objectiveId, department, weight are required" });
      }
      const assignmentWeight = parseInt(weight, 10);
      const allUsers = await storage.getAllUsers();
      const departmentUsers = department === "all"
        ? allUsers.filter((u: any) => u.role === "employee")
        : allUsers.filter((u: any) => u.department === department && u.role === "employee");

      const eligible: { id: string; name: string; currentWeight: number }[] = [];
      const skipped: { id: string; name: string; currentWeight: number }[] = [];

      for (const u of departmentUsers) {
        const assignments = await storage.getObjectiveAssignments(u.id);
        const currentWeight = assignments.reduce((s, a) => s + (a.weight || 0), 0);
        const entry = { id: u.id, name: `${u.firstName || ""} ${u.lastName || ""}`.trim(), currentWeight };
        if (currentWeight + assignmentWeight > 100) skipped.push(entry);
        else eligible.push(entry);
      }

      res.json({ eligible, skipped, totalUsers: departmentUsers.length });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Bulk assignment - assign one objective to all users in a department
  app.post("/api/assignments/bulk", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { objectiveId, department, weight, objectiveType, targetValue } = req.body;
      
      if (!objectiveId || !department) {
        return res.status(400).json({ message: "objectiveId and department are required" });
      }

      const assignmentWeight = weight || 20;

      // Get the dictionary item to retrieve clusterId
      const dictionaryItem = await storage.getObjectivesDictionaryItem(objectiveId);
      if (!dictionaryItem) {
        return res.status(404).json({ message: "Objective dictionary item not found" });
      }

      // Get all users in the department (or all users if department === "all")
      const allUsers = await storage.getAllUsers();
      const departmentUsers = department === "all"
        ? allUsers.filter((u: any) => u.role === "employee")
        : allUsers.filter(
            (u: any) => u.department === department && u.role === "employee"
          );

      if (departmentUsers.length === 0) {
        return res.status(400).json({ message: "No employees found" });
      }

      // Check weight limits for each user before creating assignments
      const skippedUsers: string[] = [];
      const eligibleUsers = [];
      
      for (const user of departmentUsers) {
        const existingAssignments = await storage.getObjectiveAssignments(user.id);
        const currentTotalWeight = existingAssignments.reduce((sum, a) => sum + (a.weight || 0), 0);
        
        if (currentTotalWeight + assignmentWeight > 100) {
          skippedUsers.push(`${user.firstName || ''} ${user.lastName || ''} (${currentTotalWeight}% assegnato)`);
        } else {
          eligibleUsers.push(user);
        }
      }

      if (eligibleUsers.length === 0) {
        return res.status(400).json({ 
          message: `Nessun utente può ricevere questo obiettivo: tutti supererebbero il 100%. Utenti esclusi: ${skippedUsers.join(', ')}`
        });
      }

      // Create an objective instance from dictionary with clusterId
      const objective = await storage.createObjective({
        dictionaryId: objectiveId,
        clusterId: dictionaryItem.indicatorClusterId,
        deadline: null,
      });

      // Create assignments for each eligible user
      const assignments = [];
      for (const user of eligibleUsers) {
        try {
          const assignment = await storage.createObjectiveAssignment({
            userId: user.id,
            objectiveId: objective.id,
            status: "assegnato",
            progress: 0,
            weight: assignmentWeight,
          });
          assignments.push(assignment);
        } catch (err) {
          // Skip if assignment already exists (unique constraint)
          console.log(`Skipping duplicate assignment for user ${user.id}`);
        }
      }

      res.status(201).json({ 
        message: "Bulk assignment completed",
        assignedCount: assignments.length,
        totalUsers: departmentUsers.length,
        skippedUsers: skippedUsers.length,
        skippedDetails: skippedUsers,
        assignments
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Clear all assignments for all users
  app.delete("/api/assignments/clear-all", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allAssignments = await storage.getAllObjectiveAssignments?.() || [];
      const deletedCount = allAssignments.length;
      
      // Delete all assignments
      for (const assignment of allAssignments) {
        try {
          await storage.deleteObjectiveAssignment(assignment.id);
        } catch (err) {
          console.log(`Error deleting assignment ${assignment.id}:`, err);
        }
      }
      
      res.json({ 
        message: "All assignments deleted successfully",
        deletedCount
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/assignments/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const assignment = await storage.getObjectiveAssignment(req.params.id);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const isAdmin = user.role === "admin";
      const isOwner = assignment.userId === userId;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Forbidden - Can only update own assignments" });
      }

      const data = insertObjectiveAssignmentSchema.partial().parse(req.body);

      if (!isAdmin) {
        if (data.userId || data.objectiveId) {
          return res.status(403).json({ 
            message: "Forbidden - Employees can only update progress and status" 
          });
        }
      }

      const updatedAssignment = await storage.updateObjectiveAssignment(req.params.id, data);
      res.json(updatedAssignment);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/assignments/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteObjectiveAssignment(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Document routes
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/documents", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(data);
      res.status(201).json(document);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/documents/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(req.params.id, data);
      res.json(document);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Document Acceptance routes
  app.get("/api/my-acceptances", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const acceptances = await storage.getUserDocumentAcceptances(userId);
      res.json(acceptances);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/acceptances", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertDocumentAcceptanceSchema.parse({
        ...req.body,
        userId,
      });
      const acceptance = await storage.acceptDocument(data);
      res.status(201).json(acceptance);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/acceptances/:documentId/status", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const isAccepted = await storage.isDocumentAccepted(userId, req.params.documentId);
      res.json({ accepted: isAccepted });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Statistics routes
  app.get("/api/my-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/stats/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.params.userId);
      res.json(stats);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Change password endpoint
  app.post("/api/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // In a real app, you would:
      // 1. Verify the currentPassword against stored hash
      // 2. Hash the newPassword
      // 3. Update the database
      
      // For demo mode, just accept it
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Feature Flags (platform module toggles)
  app.get("/api/settings/features", isAuthenticated, async (req, res) => {
    try {
      const flags = await storage.getFeatureFlags();
      res.json(flags);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.put("/api/settings/features", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const flags = req.body as Record<string, boolean>;
      await storage.setFeatureFlags(flags);
      res.json(flags);
    } catch (error) {
      handleError(res, error);
    }
  });

  // MBO Regulation acceptance endpoint
  app.post("/api/accept-mbo-regulation", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Record acceptance in database
      const acceptance = await storage.acceptMboRegulation({ userId });

      // Update user with acceptance timestamp
      const updatedUser = await storage.updateUser(userId, {
        mboRegulationAcceptedAt: acceptance.acceptedAt,
      });

      res.json({ 
        message: "MBO regulation accepted", 
        acceptedAt: updatedUser.mboRegulationAcceptedAt 
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Seed dummy data endpoint (admin only)
  app.post("/api/seed", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get existing data to avoid duplicates
      const existingClusters = await storage.getIndicatorClusters();
      
      // Create indicator clusters
      const indicatorClusters = [
        { name: "Obiettivi di Gruppo", description: "Obiettivi legati alle performance del gruppo aziendale" },
        { name: "Obiettivi di Direzione", description: "Obiettivi specifici della direzione di appartenenza" },
        { name: "Obiettivi ESG", description: "Obiettivi legati a sostenibilità, governance e responsabilità sociale" },
        { name: "Obiettivi Individuali", description: "Obiettivi personali di sviluppo e performance" },
      ];
      
      const createdClusters = [];
      for (const cluster of indicatorClusters) {
        const exists = existingClusters.some(c => c.name === cluster.name);
        if (!exists) {
          const created = await storage.createIndicatorCluster(cluster);
          createdClusters.push(created);
        } else {
          createdClusters.push(existingClusters.find(c => c.name === cluster.name)!);
        }
      }
      
      // Create calculation types
      const existingCalcTypes = await storage.getCalculationTypes();
      const calculationTypes = [
        { name: "Interpolazione Lineare", description: "Calcolo lineare tra soglia e target", formula: "(valore - soglia) / (target - soglia) * 100" },
        { name: "100% al Target", description: "100% solo se raggiunto il target esatto", formula: "valore >= target ? 100 : 0" },
        { name: "Lineare Inversa", description: "Più basso il valore, migliore il risultato", formula: "(target - valore) / (target - soglia) * 100" },
        { name: "Soglia On/Off", description: "Attivazione binaria sopra soglia", formula: "valore >= soglia ? 100 : 0" },
      ];
      
      const createdCalcTypes = [];
      for (const calcType of calculationTypes) {
        const exists = existingCalcTypes.some(c => c.name === calcType.name);
        if (!exists) {
          const created = await storage.createCalculationType(calcType);
          createdCalcTypes.push(created);
        } else {
          createdCalcTypes.push(existingCalcTypes.find(c => c.name === calcType.name)!);
        }
      }
      
      // Create business functions
      const existingBF = await storage.getBusinessFunctions();
      const businessFunctions = [
        { name: "IT Development", description: "Sviluppo software e sistemi", primoLivelloId: null, secondoLivelloId: null },
        { name: "Marketing", description: "Marketing e comunicazione", primoLivelloId: null, secondoLivelloId: null },
        { name: "Finance", description: "Amministrazione e finanza", primoLivelloId: null, secondoLivelloId: null },
        { name: "HR", description: "Risorse umane", primoLivelloId: null, secondoLivelloId: null },
        { name: "Sales", description: "Vendite e sviluppo commerciale", primoLivelloId: null, secondoLivelloId: null },
        { name: "Operations", description: "Operazioni e logistica", primoLivelloId: null, secondoLivelloId: null },
      ];
      
      let newBFCount = 0;
      for (const bf of businessFunctions) {
        const exists = existingBF.some(b => b.name === bf.name);
        if (!exists) {
          await storage.createBusinessFunction(bf);
          newBFCount++;
        }
      }
      
      // Create objectives dictionary
      const objectivesDict = [
        { title: "Incremento fatturato gruppo +10%", description: "Raggiungere un incremento del fatturato consolidato del 10% rispetto all'anno precedente", indicatorClusterId: createdClusters[0].id, calculationTypeId: createdCalcTypes[0].id, objectiveType: "numeric" as const },
        { title: "Margine operativo lordo >15%", description: "Mantenere il MOL sopra il 15% del fatturato", indicatorClusterId: createdClusters[0].id, calculationTypeId: createdCalcTypes[1].id, objectiveType: "numeric" as const },
        { title: "Customer satisfaction >4.5", description: "Raggiungere un punteggio NPS medio superiore a 4.5", indicatorClusterId: createdClusters[1].id, calculationTypeId: createdCalcTypes[0].id, objectiveType: "numeric" as const },
        { title: "Riduzione time-to-market -20%", description: "Ridurre i tempi di rilascio prodotti del 20%", indicatorClusterId: createdClusters[1].id, calculationTypeId: createdCalcTypes[2].id, objectiveType: "numeric" as const },
        { title: "Riduzione emissioni CO2 -15%", description: "Ridurre le emissioni di CO2 del 15% rispetto all'anno base", indicatorClusterId: createdClusters[2].id, calculationTypeId: createdCalcTypes[2].id, objectiveType: "numeric" as const },
        { title: "Gender diversity >40%", description: "Raggiungere almeno il 40% di rappresentanza femminile in ruoli manageriali", indicatorClusterId: createdClusters[2].id, calculationTypeId: createdCalcTypes[0].id, objectiveType: "numeric" as const },
        { title: "Completamento certificazioni", description: "Ottenere almeno 2 certificazioni professionali nell'anno", indicatorClusterId: createdClusters[3].id, calculationTypeId: createdCalcTypes[3].id, objectiveType: "qualitative" as const },
        { title: "Progetti completati on-time", description: "Completare almeno l'80% dei progetti entro le deadline", indicatorClusterId: createdClusters[3].id, calculationTypeId: createdCalcTypes[0].id, objectiveType: "numeric" as const },
      ];
      
      for (const obj of objectivesDict) {
        await storage.createObjectivesDictionaryItem(obj);
      }
      
      // Create dummy users
      const dummyUsers = [
        { id: "user-001", email: "mario.rossi@gruppo24ore.it", firstName: "Mario", lastName: "Rossi", department: "IT Development", role: "employee" as const, mboPercentage: 25 },
        { id: "user-002", email: "laura.bianchi@gruppo24ore.it", firstName: "Laura", lastName: "Bianchi", department: "Marketing", role: "employee" as const, mboPercentage: 30 },
        { id: "user-003", email: "giuseppe.verdi@gruppo24ore.it", firstName: "Giuseppe", lastName: "Verdi", department: "Finance", role: "employee" as const, mboPercentage: 20 },
        { id: "user-004", email: "francesca.neri@gruppo24ore.it", firstName: "Francesca", lastName: "Neri", department: "HR", role: "employee" as const, mboPercentage: 25 },
        { id: "user-005", email: "paolo.ferrari@gruppo24ore.it", firstName: "Paolo", lastName: "Ferrari", department: "Sales", role: "employee" as const, mboPercentage: 35 },
        { id: "user-006", email: "anna.colombo@gruppo24ore.it", firstName: "Anna", lastName: "Colombo", department: "Operations", role: "employee" as const, mboPercentage: 20 },
        { id: "user-007", email: "luca.martini@gruppo24ore.it", firstName: "Luca", lastName: "Martini", department: "IT Development", role: "employee" as const, mboPercentage: 25 },
        { id: "user-008", email: "chiara.romano@gruppo24ore.it", firstName: "Chiara", lastName: "Romano", department: "Marketing", role: "employee" as const, mboPercentage: 30 },
      ];
      
      for (const user of dummyUsers) {
        await storage.upsertUser(user);
      }
      
      res.json({ 
        message: "Seed data created successfully",
        created: {
          indicatorClusters: createdClusters.length,
          calculationTypes: createdCalcTypes.length,
          businessFunctions: newBFCount,
          objectives: objectivesDict.length,
          users: dummyUsers.length,
        },
        skipped: {
          indicatorClusters: existingClusters.length,
          calculationTypes: existingCalcTypes.length,
          businessFunctions: existingBF.length - newBFCount,
        }
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Diagnostic endpoint to check assignment/objective counts
  app.get("/api/admin/diagnostic", isAdmin, async (req, res) => {
    try {
      const rawAssignments = await storage.getAllObjectiveAssignments();
      const rawObjectives = await storage.getObjectives();
      const users = await storage.getAllUsers();

      // Check each assignment to see if its objective exists
      const assignmentDiagnostics = [];
      for (const assignment of rawAssignments) {
        const objectiveExists = rawObjectives.some(obj => obj.id === assignment.objectiveId);
        const user = users.find(u => u.id === assignment.userId);
        assignmentDiagnostics.push({
          assignmentId: assignment.id,
          userId: assignment.userId,
          userEmail: user?.email || 'unknown',
          objectiveId: assignment.objectiveId,
          objectiveExists,
          weight: assignment.weight,
          status: assignment.status
        });
      }

      res.json({
        totalAssignments: rawAssignments.length,
        totalObjectives: rawObjectives.length,
        assignmentsWithMissingObjectives: assignmentDiagnostics.filter(a => !a.objectiveExists).length,
        details: assignmentDiagnostics
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Analytics endpoints
  app.get("/api/admin/analytics/overview", isAdmin, async (req, res) => {
    try {
      // Get all users and all assignments directly (like getObjectivesWithAssignments does)
      const users = await storage.getAllUsers();
      const allAssignments = await storage.getAllObjectiveAssignments();

      console.log('[Analytics] Total users found:', users.length);
      console.log('[Analytics] Total assignments in DB:', allAssignments.length);

      // Calculate statistics
      const totalObjectives = allAssignments.length;
      const completedObjectives = allAssignments.filter(a => a.progress === 100).length;
      const inProgressObjectives = allAssignments.filter(a => (a.progress || 0) > 0 && a.progress !== 100).length;
      const notStartedObjectives = allAssignments.filter(a => !a.progress || a.progress === 0).length;

      // Calculate average completion
      const totalCompletion = allAssignments.reduce((sum, a) => sum + (a.progress || 0), 0);
      const averageCompletion = totalObjectives > 0 ? Math.round(totalCompletion / totalObjectives) : 0;

      // Count employees
      const totalEmployees = users.filter(u => u.role === 'employee').length;
      const activeEmployees = users.filter(u => u.isActive && u.role === 'employee').length;

      res.json({
        totalObjectives,
        completedObjectives,
        inProgressObjectives,
        notStartedObjectives,
        averageCompletion,
        totalEmployees,
        activeEmployees,
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/analytics/by-department", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const allAssignments = await storage.getAllObjectiveAssignments();

      const departments = new Map<string, {
        name: string;
        completed: number;
        inProgress: number;
        total: number;
        totalCompletion: number;
      }>();

      // Group assignments by user department
      for (const assignment of allAssignments) {
        const user = users.find(u => u.id === assignment.userId);
        if (!user || user.role !== 'employee') continue;

        const dept = user.department || 'Unassigned';
        if (!departments.has(dept)) {
          departments.set(dept, { name: dept, completed: 0, inProgress: 0, total: 0, totalCompletion: 0 });
        }

        const deptData = departments.get(dept)!;
        deptData.total++;
        deptData.totalCompletion += (assignment.progress || 0);

        if (assignment.progress === 100) {
          deptData.completed++;
        } else if ((assignment.progress || 0) > 0) {
          deptData.inProgress++;
        }
      }

      const result = Array.from(departments.values()).map(dept => ({
        name: dept.name,
        completed: dept.completed,
        inProgress: dept.inProgress,
        total: dept.total,
        avgCompletion: dept.total > 0 ? Math.round(dept.totalCompletion / dept.total) : 0,
      }));

      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/analytics/by-cluster", isAdmin, async (req, res) => {
    try {
      // Get all indicator clusters
      const clusters = await storage.getIndicatorClusters();

      // Get all objectives with their assignments
      const objectivesWithAssignments = await storage.getObjectivesWithAssignments();

      // Count objectives per cluster
      const clusterCounts = new Map<string, { name: string; count: number }>();

      for (const cluster of clusters) {
        clusterCounts.set(cluster.id, { name: cluster.name, count: 0 });
      }

      // Count assignments grouped by cluster
      for (const objData of objectivesWithAssignments) {
        if (objData.indicatorCluster) {
          const clusterId = objData.indicatorCluster.id;
          const clusterData = clusterCounts.get(clusterId);
          if (clusterData) {
            clusterData.count += objData.assignedUsers.length;
          }
        }
      }

      const result = Array.from(clusterCounts.values());
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/analytics/eligibles", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const departmentMap = new Map<string, { eligibles: number; total: number }>();

      for (const user of users) {
        if (user.role !== 'employee') continue;

        const dept = user.department || 'Unassigned';
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, { eligibles: 0, total: 0 });
        }

        const deptData = departmentMap.get(dept)!;
        deptData.total++;

        // Check if user has MBO percentage set (is eligible)
        if (user.mboPercentage && user.mboPercentage > 0) {
          deptData.eligibles++;
        }
      }

      const result = Array.from(departmentMap.entries()).map(([name, data]) => ({
        name,
        eligibles: data.eligibles,
        total: data.total,
      }));

      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/analytics/financial", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const allAssignments = await storage.getAllObjectiveAssignments();

      let theoreticalTargetPayout = 0;
      let actualProjectedPayout = 0;
      const employeePayouts = [];
      const departmentPayoutsMap = new Map<string, { theoretical: number; actual: number; count: number; totalCompletion: number }>();

      // Group assignments by user
      const assignmentsByUser = new Map<string, typeof allAssignments>();
      for (const assignment of allAssignments) {
        if (!assignmentsByUser.has(assignment.userId)) {
          assignmentsByUser.set(assignment.userId, []);
        }
        assignmentsByUser.get(assignment.userId)!.push(assignment);
      }

      for (const user of users) {
        if (user.role !== 'employee' || !user.ral || user.ral === 0) continue;

        const ral = parseFloat(String(user.ral));
        const mboPercentage = user.mboPercentage || 0;
        const theoreticalMbo = (ral * mboPercentage) / 100;

        // Get assignments and calculate average completion
        const assignments = assignmentsByUser.get(user.id) || [];
        const totalCompletion = assignments.reduce((sum, a) => sum + (a.progress || 0), 0);
        const avgCompletion = assignments.length > 0 ? totalCompletion / assignments.length : 0;

        // Actual MBO based on completion percentage
        const actualMbo = (theoreticalMbo * avgCompletion) / 100;

        theoreticalTargetPayout += theoreticalMbo;
        actualProjectedPayout += actualMbo;

        employeePayouts.push({
          name: `${user.firstName} ${user.lastName}`,
          ral,
          mboPercentage,
          theoreticalMbo: Math.round(theoreticalMbo),
          actualMbo: Math.round(actualMbo),
          completion: Math.round(avgCompletion),
        });

        // Department aggregation
        const dept = user.department || 'Unassigned';
        if (!departmentPayoutsMap.has(dept)) {
          departmentPayoutsMap.set(dept, { theoretical: 0, actual: 0, count: 0, totalCompletion: 0 });
        }
        const deptData = departmentPayoutsMap.get(dept)!;
        deptData.theoretical += theoreticalMbo;
        deptData.actual += actualMbo;
        deptData.count++;
        deptData.totalCompletion += avgCompletion;
      }

      const departmentPayouts = Array.from(departmentPayoutsMap.entries()).map(([name, data]) => ({
        name,
        theoretical: Math.round(data.theoretical),
        actual: Math.round(data.actual),
        completion: data.count > 0 ? Math.round(data.totalCompletion / data.count) : 0,
      }));

      const savings = theoreticalTargetPayout - actualProjectedPayout;
      const savingsPercentage = theoreticalTargetPayout > 0
        ? Math.round((savings / theoreticalTargetPayout) * 100)
        : 0;

      // Calculate average theoretical MBO per employee
      const eligibleEmployees = employeePayouts.length;
      const averageTheoreticalMBO = eligibleEmployees > 0
        ? Math.round(theoreticalTargetPayout / eligibleEmployees)
        : 0;

      res.json({
        theoreticalTargetPayout: Math.round(theoreticalTargetPayout),
        actualProjectedPayout: Math.round(actualProjectedPayout),
        savings: Math.round(savings),
        savingsPercentage,
        averageTheoreticalMBO,
        employeePayouts: employeePayouts.slice(0, 10), // Top 10 employees
        departmentPayouts,
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===============================================
  // CUSTOM FIELDS ROUTES
  // ===============================================

  // Get all custom field definitions (active only for non-admins)
  app.get("/api/custom-fields", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const isAdminUser = user?.role === "admin";

      const fields = await storage.getCustomFieldDefinitions(isAdminUser);
      res.json(fields);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get single custom field definition
  app.get("/api/custom-fields/:id", isAuthenticated, async (req, res) => {
    try {
      const field = await storage.getCustomFieldDefinition(req.params.id);
      if (!field) {
        return res.status(404).json({ message: "Custom field not found" });
      }
      res.json(field);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create custom field definition (admin only)
  app.post("/api/custom-fields", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertCustomFieldDefinitionSchema.parse(req.body);

      const field = await storage.createCustomFieldDefinition({
        ...data,
        createdBy: userId,
      });

      res.status(201).json(field);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update custom field definition (admin only)
  app.patch("/api/custom-fields/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertCustomFieldDefinitionSchema.partial().parse(req.body);
      const field = await storage.updateCustomFieldDefinition(req.params.id, data);

      if (!field) {
        return res.status(404).json({ message: "Custom field not found" });
      }

      res.json(field);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Delete custom field definition (admin only)
  app.delete("/api/custom-fields/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCustomFieldDefinition(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get custom field values for a user
  app.get("/api/users/:userId/custom-field-values", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = getUserId(req);
      const targetUserId = req.params.userId;
      const requestingUser = await storage.getUser(requestingUserId);

      // Users can only view their own values unless they're admin
      if (requestingUser?.role !== "admin" && requestingUserId !== targetUserId) {
        return res.status(403).json({ message: "Forbidden - can only view own custom fields" });
      }

      const values = await storage.getCustomFieldValues(targetUserId);
      res.json(values);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Set/update custom field value for a user
  app.put("/api/users/:userId/custom-field-values/:fieldId", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = getUserId(req);
      const targetUserId = req.params.userId;
      const fieldId = req.params.fieldId;
      const { value } = req.body;

      const requestingUser = await storage.getUser(requestingUserId);

      // Users can only update their own values unless they're admin
      if (requestingUser?.role !== "admin" && requestingUserId !== targetUserId) {
        return res.status(403).json({ message: "Forbidden - can only update own custom fields" });
      }

      const fieldValue = await storage.setCustomFieldValue({
        fieldId,
        userId: targetUserId,
        value: value?.toString() || null,
      });

      res.json(fieldValue);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Bulk update custom field values for a user
  app.post("/api/users/:userId/custom-field-values/bulk", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = getUserId(req);
      const targetUserId = req.params.userId;
      const { values } = req.body; // Array of { fieldId, value }

      const requestingUser = await storage.getUser(requestingUserId);

      // Users can only update their own values unless they're admin
      if (requestingUser?.role !== "admin" && requestingUserId !== targetUserId) {
        return res.status(403).json({ message: "Forbidden - can only update own custom fields" });
      }

      const results = [];
      for (const item of values) {
        const fieldValue = await storage.setCustomFieldValue({
          fieldId: item.fieldId,
          userId: targetUserId,
          value: item.value?.toString() || null,
        });
        results.push(fieldValue);
      }

      res.json(results);
    } catch (error) {
      handleError(res, error);
    }
  });

  // ============================================================================
  // COMPETENCY MANAGEMENT ENDPOINTS
  // ============================================================================

  // -------------------- Admin: Competency Models --------------------

  // Get all competency models
  app.get("/api/admin/competency-models", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { personaType, isActive } = req.query;
      const filters: any = {};
      if (personaType) filters.personaType = personaType as string;
      if (isActive !== undefined) filters.isActive = isActive === "true";

      const models = await competenciesStorage.getCompetencyModels(filters);
      res.json(models);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get single competency model
  app.get("/api/admin/competency-models/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const model = await competenciesStorage.getCompetencyModel(req.params.id);
      if (!model) {
        return res.status(404).json({ message: "Competency model not found" });
      }
      res.json(model);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create competency model
  app.post("/api/admin/competency-models", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertCompetencyModelSchema.parse({ ...req.body, createdBy: userId });
      const model = await competenciesStorage.createCompetencyModel(data);
      res.status(201).json(model);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update competency model
  app.patch("/api/admin/competency-models/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertCompetencyModelSchema.partial().parse(req.body);
      const model = await competenciesStorage.updateCompetencyModel(req.params.id, data);
      res.json(model);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Delete competency model
  app.delete("/api/admin/competency-models/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await competenciesStorage.deleteCompetencyModel(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get competencies for a model
  app.get("/api/admin/competency-models/:id/competencies", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const competencies = await competenciesStorage.getCompetencies({ modelId: req.params.id });
      res.json(competencies);
    } catch (error) {
      handleError(res, error);
    }
  });

  // -------------------- Admin: Competencies --------------------

  // Get all competencies
  app.get("/api/admin/competencies", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { modelId, isTransversal } = req.query;
      const filters: any = {};
      if (modelId) filters.modelId = modelId as string;
      if (isTransversal !== undefined) filters.isTransversal = isTransversal === "true";

      const competencies = await competenciesStorage.getCompetencies(filters);
      res.json(competencies);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get single competency
  app.get("/api/admin/competencies/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const competency = await competenciesStorage.getCompetency(req.params.id);
      if (!competency) {
        return res.status(404).json({ message: "Competency not found" });
      }
      res.json(competency);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create competency
  app.post("/api/admin/competencies", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertCompetencySchema.parse(req.body);
      const competency = await competenciesStorage.createCompetency(data);
      res.status(201).json(competency);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update competency
  app.patch("/api/admin/competencies/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertCompetencySchema.partial().parse(req.body);
      const competency = await competenciesStorage.updateCompetency(req.params.id, data);
      res.json(competency);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Delete competency
  app.delete("/api/admin/competencies/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await competenciesStorage.deleteCompetency(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // -------------------- Employee: Evaluation Cycles --------------------

  // Get active evaluation cycles for employees
  app.get("/api/evaluation-cycles/active", isAuthenticated, async (req, res) => {
    try {
      const cycles = await competenciesStorage.getEvaluationCycles({ status: "active" });
      res.json(cycles);
    } catch (error) {
      handleError(res, error);
    }
  });

  // -------------------- Admin: Evaluation Cycles --------------------

  // Get all evaluation cycles
  app.get("/api/admin/evaluation-cycles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status, year } = req.query;
      const filters: any = {};
      if (status) filters.status = status as string;
      if (year) filters.year = parseInt(year as string);

      const cycles = await competenciesStorage.getEvaluationCycles(filters);
      res.json(cycles);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get single evaluation cycle
  app.get("/api/admin/evaluation-cycles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const cycle = await competenciesStorage.getEvaluationCycle(req.params.id);
      if (!cycle) {
        return res.status(404).json({ message: "Evaluation cycle not found" });
      }
      res.json(cycle);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create evaluation cycle
  app.post("/api/admin/evaluation-cycles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertEvaluationCycleSchema.parse({ ...req.body, createdBy: userId });
      const cycle = await competenciesStorage.createEvaluationCycle(data);
      res.status(201).json(cycle);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update evaluation cycle
  app.patch("/api/admin/evaluation-cycles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertEvaluationCycleSchema.partial().parse(req.body);
      const cycle = await competenciesStorage.updateEvaluationCycle(req.params.id, data);
      res.json(cycle);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update evaluation cycle status
  app.patch("/api/admin/evaluation-cycles/:id/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["draft", "active", "completed", "archived"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const cycle = await competenciesStorage.updateEvaluationCycleStatus(req.params.id, status);
      res.json(cycle);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Delete evaluation cycle
  app.delete("/api/admin/evaluation-cycles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await competenciesStorage.deleteEvaluationCycle(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // -------------------- Admin: Analytics --------------------

  // Get competencies overview
  app.get("/api/admin/analytics/competencies-overview", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { cycleId } = req.query;
      if (!cycleId) {
        return res.status(400).json({ message: "cycleId is required" });
      }
      const overview = await competenciesStorage.getCompetenciesOverview(cycleId as string);
      res.json(overview);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get competencies by department
  app.get("/api/admin/analytics/competencies-by-department", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { cycleId } = req.query;
      if (!cycleId) {
        return res.status(400).json({ message: "cycleId is required" });
      }
      const data = await competenciesStorage.getCompetenciesByDepartment(cycleId as string);
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get competencies by persona
  app.get("/api/admin/analytics/competencies-by-persona", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { cycleId } = req.query;
      if (!cycleId) {
        return res.status(400).json({ message: "cycleId is required" });
      }
      const data = await competenciesStorage.getCompetenciesByPersona(cycleId as string);
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get process progress
  app.get("/api/admin/analytics/competencies-progress", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { cycleId } = req.query;
      if (!cycleId) {
        return res.status(400).json({ message: "cycleId is required" });
      }
      const progress = await competenciesStorage.getProcessProgress(cycleId as string);
      res.json(progress);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get ratings distribution
  app.get("/api/admin/analytics/competencies-ratings-distribution", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { cycleId } = req.query;
      if (!cycleId) {
        return res.status(400).json({ message: "cycleId is required" });
      }
      const distribution = await competenciesStorage.getRatingsDistribution(cycleId as string);
      res.json(distribution);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get development plans status
  app.get("/api/admin/analytics/development-plans-status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { cycleId } = req.query;
      if (!cycleId) {
        return res.status(400).json({ message: "cycleId is required" });
      }
      const status = await competenciesStorage.getDevelopmentPlansStatus(cycleId as string);
      res.json(status);
    } catch (error) {
      handleError(res, error);
    }
  });

  // -------------------- Lookup Tables (Anagrafica) --------------------

  // SEDI - Locations
  app.get("/api/admin/sedi", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db.select().from(sedi).orderBy(desc(sedi.updatedAt));
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/sedi/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db.select().from(sedi).where(eq(sedi.id, req.params.id));
      if (!result.length) {
        return res.status(404).json({ message: "Sede not found" });
      }
      res.json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/sedi", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertSediSchema.parse(req.body);
      const result = await db.insert(sedi).values(data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/admin/sedi/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertSediSchema.partial().parse(req.body);
      const result = await db.update(sedi).set(data).where(eq(sedi.id, req.params.id)).returning();
      if (!result.length) {
        return res.status(404).json({ message: "Sede not found" });
      }
      res.json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/admin/sedi/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await db.delete(sedi).where(eq(sedi.id, req.params.id));
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // CCNL - Collective Labor Agreements
  app.get("/api/admin/ccnl", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db.select().from(ccnl).orderBy(desc(ccnl.updatedAt));
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/ccnl/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db.select().from(ccnl).where(eq(ccnl.id, req.params.id));
      if (!result.length) {
        return res.status(404).json({ message: "CCNL not found" });
      }
      res.json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/ccnl", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertCcnlSchema.parse(req.body);
      const result = await db.insert(ccnl).values(data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/admin/ccnl/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertCcnlSchema.partial().parse(req.body);
      const result = await db.update(ccnl).set(data).where(eq(ccnl.id, req.params.id)).returning();
      if (!result.length) {
        return res.status(404).json({ message: "CCNL not found" });
      }
      res.json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/admin/ccnl/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await db.delete(ccnl).where(eq(ccnl.id, req.params.id));
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // LIVELLI CONTRATTUALI - Contract Levels (filtered by CCNL)
  app.get("/api/admin/livelli-contrattuali", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { ccnlId } = req.query;
      let query = db.select().from(livelliContrattuali);

      if (ccnlId) {
        query = query.where(eq(livelliContrattuali.ccnlId, ccnlId as string));
      }

      const result = await query.orderBy(asc(livelliContrattuali.ordinamento), desc(livelliContrattuali.updatedAt));
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/livelli-contrattuali/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db.select().from(livelliContrattuali).where(eq(livelliContrattuali.id, req.params.id));
      if (!result.length) {
        return res.status(404).json({ message: "Livello contrattuale not found" });
      }
      res.json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/livelli-contrattuali", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertLivelliContrattualiSchema.parse(req.body);
      const result = await db.insert(livelliContrattuali).values(data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/admin/livelli-contrattuali/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertLivelliContrattualiSchema.partial().parse(req.body);
      const result = await db.update(livelliContrattuali).set(data).where(eq(livelliContrattuali.id, req.params.id)).returning();
      if (!result.length) {
        return res.status(404).json({ message: "Livello contrattuale not found" });
      }
      res.json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/admin/livelli-contrattuali/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await db.delete(livelliContrattuali).where(eq(livelliContrattuali.id, req.params.id));
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // CATEGORIE PROTETTE - Protected Categories
  app.get("/api/admin/categorie-protette", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db.select().from(categorieProtette).orderBy(desc(categorieProtette.updatedAt));
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/categorie-protette/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db.select().from(categorieProtette).where(eq(categorieProtette.id, req.params.id));
      if (!result.length) {
        return res.status(404).json({ message: "Categoria protetta not found" });
      }
      res.json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/categorie-protette", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertCategorieProtetteSchema.parse(req.body);
      const result = await db.insert(categorieProtette).values(data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/admin/categorie-protette/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertCategorieProtetteSchema.partial().parse(req.body);
      const result = await db.update(categorieProtette).set(data).where(eq(categorieProtette.id, req.params.id)).returning();
      if (!result.length) {
        return res.status(404).json({ message: "Categoria protetta not found" });
      }
      res.json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/admin/categorie-protette/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await db.delete(categorieProtette).where(eq(categorieProtette.id, req.params.id));
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // CONFIGURAZIONI ORARIO - Time Configurations (tipo_orario or timbra_firma)
  app.get("/api/admin/configurazioni-orario", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { tipo } = req.query;
      let query = db.select().from(configurazioniOrario);

      if (tipo) {
        query = query.where(eq(configurazioniOrario.tipo, tipo as string));
      }

      const result = await query.orderBy(desc(configurazioniOrario.updatedAt));
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/configurazioni-orario/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db.select().from(configurazioniOrario).where(eq(configurazioniOrario.id, req.params.id));
      if (!result.length) {
        return res.status(404).json({ message: "Configurazione orario not found" });
      }
      res.json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/configurazioni-orario", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertConfigurazioniOrarioSchema.parse(req.body);
      const result = await db.insert(configurazioniOrario).values(data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/admin/configurazioni-orario/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertConfigurazioniOrarioSchema.partial().parse(req.body);
      const result = await db.update(configurazioniOrario).set(data).where(eq(configurazioniOrario.id, req.params.id)).returning();
      if (!result.length) {
        return res.status(404).json({ message: "Configurazione orario not found" });
      }
      res.json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/admin/configurazioni-orario/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await db.delete(configurazioniOrario).where(eq(configurazioniOrario.id, req.params.id));
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // CAUSALI ASSUNZIONE - Hiring Reasons
  app.get("/api/admin/causali-assunzione", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db.select().from(causaliAssunzione).orderBy(desc(causaliAssunzione.updatedAt));
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/causali-assunzione/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db.select().from(causaliAssunzione).where(eq(causaliAssunzione.id, req.params.id));
      if (!result.length) {
        return res.status(404).json({ message: "Causale assunzione not found" });
      }
      res.json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/causali-assunzione", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertCausaliAssunzioneSchema.parse(req.body);
      const result = await db.insert(causaliAssunzione).values(data).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/admin/causali-assunzione/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertCausaliAssunzioneSchema.partial().parse(req.body);
      const result = await db.update(causaliAssunzione).set(data).where(eq(causaliAssunzione.id, req.params.id)).returning();
      if (!result.length) {
        return res.status(404).json({ message: "Causale assunzione not found" });
      }
      res.json(result[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/admin/causali-assunzione/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await db.delete(causaliAssunzione).where(eq(causaliAssunzione.id, req.params.id));
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ==============================================
  // ANAGRAFICA ENDPOINTS - Phase 3
  // ==============================================

  // 1. GET /api/admin/anagrafica/:codiceFiscale - Fetch complete employee data
  app.get("/api/admin/anagrafica/:codiceFiscale", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { codiceFiscale } = req.params;

      // Fetch persona
      const personaData = await db.select().from(persona).where(eq(persona.codiceFiscale, codiceFiscale));
      if (!personaData.length) {
        return res.status(404).json({ message: "Persona not found" });
      }

      // Fetch related data
      const [contattiData, orgData, contrattiData, compensationData, ruoliData, swData] = await Promise.all([
        db.select().from(contatti).where(eq(contatti.codiceFiscale, codiceFiscale)),
        db.select().from(organizzazione).where(eq(organizzazione.codiceFiscale, codiceFiscale)),
        db.select().from(contratti).where(eq(contratti.codiceFiscale, codiceFiscale)).orderBy(desc(contratti.createdAt)).limit(1),
        db.select().from(compensation).where(and(eq(compensation.codiceFiscale, codiceFiscale), eq(compensation.isCurrent, true))).limit(1),
        db.select().from(ruoli).where(eq(ruoli.codiceFiscale, codiceFiscale)),
        db.select().from(smartWorkingStorico).where(eq(smartWorkingStorico.codiceFiscale, codiceFiscale)).orderBy(desc(smartWorkingStorico.dataDecorrenza)),
      ]);

      const result = {
        persona: personaData[0],
        contatti: contattiData[0] || null,
        organizzazione: orgData[0] || null,
        contratto: contrattiData[0] || null,
        compensation: compensationData[0] || null,
        ruoli: ruoliData[0] || null,
        smartWorking: swData || [],
      };

      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  // 2. POST /api/admin/anagrafica - Create new employee
  app.post("/api/admin/anagrafica", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { persona: personaPayload, contatti: contattiPayload, organizzazione: orgPayload, contratto: contrattoPayload, compensation: compensationPayload, ruoli: ruoliPayload } = req.body;

      // Validate CF required
      if (!personaPayload?.codiceFiscale) {
        return res.status(400).json({ message: "Codice Fiscale is required" });
      }

      // Check if persona already exists
      const existing = await db.select().from(persona).where(eq(persona.codiceFiscale, personaPayload.codiceFiscale));
      if (existing.length > 0) {
        return res.status(409).json({ message: "Persona with this Codice Fiscale already exists" });
      }

      // Insert persona
      const personaValidated = insertPersonaSchema.parse(personaPayload);
      const [newPersona] = await db.insert(persona).values(personaValidated).returning();

      // Insert related data if provided
      let newContatti = null;
      let newOrg = null;
      let newContratto = null;
      let newCompensation = null;
      let newRuoli = null;

      if (contattiPayload) {
        const contattiValidated = insertContattiSchema.parse({ ...contattiPayload, codiceFiscale: newPersona.codiceFiscale });
        [newContatti] = await db.insert(contatti).values(contattiValidated).returning();
      }

      if (orgPayload) {
        const orgValidated = insertOrganizzazioneSchema.parse({ ...orgPayload, codiceFiscale: newPersona.codiceFiscale });
        [newOrg] = await db.insert(organizzazione).values(orgValidated).returning();
      }

      if (contrattoPayload) {
        const contrattoValidated = insertContrattiSchema.parse({ ...contrattoPayload, codiceFiscale: newPersona.codiceFiscale, matricola: newPersona.matricola });
        [newContratto] = await db.insert(contratti).values(contrattoValidated).returning();
      }

      if (compensationPayload) {
        const compensationValidated = insertCompensationSchema.parse({ ...compensationPayload, codiceFiscale: newPersona.codiceFiscale });
        [newCompensation] = await db.insert(compensation).values(compensationValidated).returning();
      }

      if (ruoliPayload) {
        const ruoliValidated = insertRuoliSchema.parse({ ...ruoliPayload, codiceFiscale: newPersona.codiceFiscale });
        [newRuoli] = await db.insert(ruoli).values(ruoliValidated).returning();
      }

      res.status(201).json({
        persona: newPersona,
        contatti: newContatti,
        organizzazione: newOrg,
        contratto: newContratto,
        compensation: newCompensation,
        ruoli: newRuoli,
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // 3. PUT /api/admin/anagrafica/:codiceFiscale - Update complete employee data (transactional)
  app.put("/api/admin/anagrafica/:codiceFiscale", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { codiceFiscale } = req.params;
      const { persona: personaPayload, contatti: contattiPayload, organizzazione: orgPayload, contratto: contrattoPayload, compensation: compensationPayload, ruoli: ruoliPayload } = req.body;

      // Check if persona exists
      const existing = await db.select().from(persona).where(eq(persona.codiceFiscale, codiceFiscale));
      if (!existing.length) {
        return res.status(404).json({ message: "Persona not found" });
      }

      // Update persona
      let updatedPersona = existing[0];
      if (personaPayload) {
        const personaValidated = insertPersonaSchema.partial().parse(personaPayload);
        [updatedPersona] = await db.update(persona).set({ ...personaValidated, updatedAt: new Date() }).where(eq(persona.codiceFiscale, codiceFiscale)).returning();
      }

      // Update or insert contatti
      let updatedContatti = null;
      if (contattiPayload) {
        const existingContatti = await db.select().from(contatti).where(eq(contatti.codiceFiscale, codiceFiscale));
        const contattiValidated = insertContattiSchema.partial().parse({ ...contattiPayload, codiceFiscale });

        if (existingContatti.length > 0) {
          [updatedContatti] = await db.update(contatti).set({ ...contattiValidated, updatedAt: new Date() }).where(eq(contatti.codiceFiscale, codiceFiscale)).returning();
        } else {
          const fullValidated = insertContattiSchema.parse({ ...contattiPayload, codiceFiscale });
          [updatedContatti] = await db.insert(contatti).values(fullValidated).returning();
        }
      }

      // Update or insert organizzazione
      let updatedOrg = null;
      if (orgPayload) {
        const existingOrg = await db.select().from(organizzazione).where(eq(organizzazione.codiceFiscale, codiceFiscale));
        const orgValidated = insertOrganizzazioneSchema.partial().parse({ ...orgPayload, codiceFiscale });

        if (existingOrg.length > 0) {
          [updatedOrg] = await db.update(organizzazione).set({ ...orgValidated, updatedAt: new Date() }).where(eq(organizzazione.codiceFiscale, codiceFiscale)).returning();
        } else {
          const fullValidated = insertOrganizzazioneSchema.parse({ ...orgPayload, codiceFiscale });
          [updatedOrg] = await db.insert(organizzazione).values(fullValidated).returning();
        }
      }

      // Update or insert contratto (latest one)
      let updatedContratto = null;
      if (contrattoPayload) {
        const existingContratto = await db.select().from(contratti).where(eq(contratti.codiceFiscale, codiceFiscale)).orderBy(desc(contratti.createdAt)).limit(1);
        const contrattoValidated = insertContrattiSchema.partial().parse({ ...contrattoPayload, codiceFiscale, matricola: updatedPersona.matricola });

        if (existingContratto.length > 0) {
          [updatedContratto] = await db.update(contratti).set({ ...contrattoValidated, updatedAt: new Date() }).where(eq(contratti.id, existingContratto[0].id)).returning();
        } else {
          const fullValidated = insertContrattiSchema.parse({ ...contrattoPayload, codiceFiscale, matricola: updatedPersona.matricola });
          [updatedContratto] = await db.insert(contratti).values(fullValidated).returning();
        }
      }

      // Update or insert compensation (current one)
      let updatedCompensation = null;
      if (compensationPayload) {
        const existingCompensation = await db.select().from(compensation).where(and(eq(compensation.codiceFiscale, codiceFiscale), eq(compensation.isCurrent, true))).limit(1);
        const compensationValidated = insertCompensationSchema.partial().parse({ ...compensationPayload, codiceFiscale });

        if (existingCompensation.length > 0) {
          [updatedCompensation] = await db.update(compensation).set({ ...compensationValidated, updatedAt: new Date() }).where(eq(compensation.id, existingCompensation[0].id)).returning();
        } else {
          const fullValidated = insertCompensationSchema.parse({ ...compensationPayload, codiceFiscale, isCurrent: true });
          [updatedCompensation] = await db.insert(compensation).values(fullValidated).returning();
        }
      }

      // Update or insert ruoli
      let updatedRuoli = null;
      if (ruoliPayload) {
        const existingRuoli = await db.select().from(ruoli).where(eq(ruoli.codiceFiscale, codiceFiscale));
        const ruoliValidated = insertRuoliSchema.partial().parse({ ...ruoliPayload, codiceFiscale });

        if (existingRuoli.length > 0) {
          [updatedRuoli] = await db.update(ruoli).set({ ...ruoliValidated, updatedAt: new Date() }).where(eq(ruoli.codiceFiscale, codiceFiscale)).returning();
        } else {
          const fullValidated = insertRuoliSchema.parse({ ...ruoliPayload, codiceFiscale });
          [updatedRuoli] = await db.insert(ruoli).values(fullValidated).returning();
        }
      }

      res.json({
        persona: updatedPersona,
        contatti: updatedContatti,
        organizzazione: updatedOrg,
        contratto: updatedContratto,
        compensation: updatedCompensation,
        ruoli: updatedRuoli,
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  // 4. GET /api/admin/persone - List of people for autocomplete
  app.get("/api/admin/persone", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db
        .select({
          codiceFiscale: persona.codiceFiscale,
          matricola: persona.matricola,
          cognome: persona.cognome,
          nome: persona.nome,
          email: contatti.email,
        })
        .from(persona)
        .leftJoin(contatti, eq(persona.codiceFiscale, contatti.codiceFiscale))
        .orderBy(asc(persona.cognome), asc(persona.nome));

      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  });

  // 5. POST /api/admin/smart-working - Add smart working period
  app.post("/api/admin/smart-working", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertSmartWorkingStoricoSchema.parse(req.body);

      // If this is marked as current, set all other periods for this CF as not current
      if (data.isCurrent) {
        await db.update(smartWorkingStorico)
          .set({ isCurrent: false, updatedAt: new Date() })
          .where(and(
            eq(smartWorkingStorico.codiceFiscale, data.codiceFiscale),
            eq(smartWorkingStorico.isCurrent, true)
          ));
      }

      const [newPeriod] = await db.insert(smartWorkingStorico).values(data).returning();
      res.status(201).json(newPeriod);
    } catch (error) {
      handleError(res, error);
    }
  });

  // 6. PATCH /api/admin/smart-working/:id - Update smart working period
  app.patch("/api/admin/smart-working/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertSmartWorkingStoricoSchema.partial().parse(req.body);

      // If setting as current, unset other current periods for the same CF
      if (data.isCurrent === true) {
        const existing = await db.select().from(smartWorkingStorico).where(eq(smartWorkingStorico.id, req.params.id));
        if (existing.length > 0) {
          await db.update(smartWorkingStorico)
            .set({ isCurrent: false, updatedAt: new Date() })
            .where(and(
              eq(smartWorkingStorico.codiceFiscale, existing[0].codiceFiscale),
              eq(smartWorkingStorico.isCurrent, true)
            ));
        }
      }

      const [updated] = await db.update(smartWorkingStorico)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(smartWorkingStorico.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Smart working period not found" });
      }

      res.json(updated);
    } catch (error) {
      handleError(res, error);
    }
  });

  // 7. DELETE /api/admin/smart-working/:id - Delete smart working period
  app.delete("/api/admin/smart-working/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await db.delete(smartWorkingStorico).where(eq(smartWorkingStorico.id, req.params.id));
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // 8. PATCH /api/admin/smart-working/:id/close - Close smart working period
  app.patch("/api/admin/smart-working/:id/close", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(smartWorkingStorico)
        .set({
          dataScadenza: new Date(),
          isCurrent: false,
          updatedAt: new Date(),
        })
        .where(eq(smartWorkingStorico.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Smart working period not found" });
      }

      res.json(updated);
    } catch (error) {
      handleError(res, error);
    }
  });

  // -------------------- Employee: My Competencies --------------------

  // Get my competencies (based on my persona type)
  app.get("/api/my-competencies", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);

      // Get user's current competency model assignment
      const assignment = await competenciesStorage.getCurrentUserCompetencyModelAssignment(userId);

      if (!assignment || !assignment.competencyModelId) {
        return res.status(400).json({ message: "No competency model assigned to user" });
      }

      // Get competencies for the assigned model
      const competencies = await competenciesStorage.getCompetenciesByModelId(assignment.competencyModelId);
      res.json(competencies);
    } catch (error) {
      handleError(res, error);
    }
  });

  // -------------------- Employee: Self Assessments --------------------

  // Get my self assessments for a cycle
  app.get("/api/self-assessments/:cycleId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const assessments = await competenciesStorage.getSelfAssessments(req.params.cycleId, userId);
      res.json(assessments);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create or update self assessment
  app.post("/api/self-assessments", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertSelfAssessmentSchema.parse({ ...req.body, userId });
      const assessment = await competenciesStorage.createOrUpdateSelfAssessment(data);
      res.status(201).json(assessment);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Submit self assessments (final submission)
  app.post("/api/self-assessments/:cycleId/submit", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await competenciesStorage.submitSelfAssessments(req.params.cycleId, userId);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // -------------------- Employee: Overall Self Assessment --------------------

  // Get overall self assessment for a cycle
  app.get("/api/overall-self-assessment/:cycleId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const assessment = await competenciesStorage.getOverallSelfAssessment(req.params.cycleId, userId);
      if (!assessment) {
        return res.status(404).json({ message: "Overall self assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create or update overall self assessment
  app.post("/api/overall-self-assessment", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertOverallSelfAssessmentSchema.parse({ ...req.body, userId });
      const assessment = await competenciesStorage.createOrUpdateOverallSelfAssessment(data);
      res.status(201).json(assessment);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Submit overall self assessment
  app.post("/api/overall-self-assessment/:cycleId/submit", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await competenciesStorage.submitOverallSelfAssessment(req.params.cycleId, userId);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // -------------------- Employee: Peer Feedback --------------------

  // Get peer feedback requests I've received
  app.get("/api/peer-feedback-requests/:cycleId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const requests = await competenciesStorage.getPeerFeedbackRequests(req.params.cycleId, userId);
      res.json(requests);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Request peer feedback from colleagues
  app.post("/api/peer-feedback-requests", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { cycleId, peerUserIds } = req.body;
      if (!cycleId || !peerUserIds || !Array.isArray(peerUserIds)) {
        return res.status(400).json({ message: "cycleId and peerUserIds array are required" });
      }
      const requests = await competenciesStorage.createPeerFeedbackRequest(cycleId, userId, peerUserIds);
      res.status(201).json(requests);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Provide peer feedback for a colleague
  app.post("/api/peer-feedbacks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertPeerFeedbackSchema.parse({ ...req.body, peerUserId: userId });
      const feedback = await competenciesStorage.createPeerFeedback(data);
      res.status(201).json(feedback);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get aggregated peer feedback I've received (anonymous)
  app.get("/api/peer-feedbacks/:cycleId/received", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const feedback = await competenciesStorage.getAggregatedPeerFeedback(req.params.cycleId, userId);
      res.json(feedback);
    } catch (error) {
      handleError(res, error);
    }
  });

  // -------------------- Employee: Development Plans --------------------

  // Get my development plan for a cycle
  app.get("/api/development-plans/:cycleId/mine", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const plan = await competenciesStorage.getDevelopmentPlan(req.params.cycleId, userId);
      if (!plan) {
        return res.status(404).json({ message: "Development plan not found" });
      }
      res.json(plan);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update employee notes on development plan
  app.patch("/api/development-plans/:id/employee-notes", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { employeeNotes } = req.body;

      // Verify this plan belongs to the requesting user
      const plan = await competenciesStorage.getDevelopmentPlanById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Development plan not found" });
      }
      if (plan.employeeUserId !== userId) {
        return res.status(403).json({ message: "Forbidden - not your development plan" });
      }
      // Can only edit notes if status is draft
      if (plan.status !== "draft") {
        return res.status(400).json({ message: "Cannot edit notes after plan is agreed" });
      }

      const updatedPlan = await competenciesStorage.updateDevelopmentPlan(req.params.id, { employeeNotes });
      res.json(updatedPlan);
    } catch (error) {
      handleError(res, error);
    }
  });

  // -------------------- Manager: Team Evaluations --------------------

  // Get team members to evaluate
  app.get("/api/manager/team-members", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const teamMembers = await competenciesStorage.getTeamMembers(managerId);
      res.json(teamMembers);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get team evaluations for a specific cycle
  app.get("/api/manager/team-evaluations/:cycleId", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const { cycleId } = req.params;
      const teamEvaluations = await competenciesStorage.getTeamEvaluations(cycleId, managerId);
      res.json(teamEvaluations);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get employee's self assessment
  app.get("/api/manager/employee/:userId/self-assessment/:cycleId", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const { userId, cycleId } = req.params;
      const assessments = await competenciesStorage.getSelfAssessments(cycleId, userId);
      res.json(assessments);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get employee's aggregated peer feedback
  app.get("/api/manager/employee/:userId/peer-feedback/:cycleId", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const { userId, cycleId } = req.params;
      const feedback = await competenciesStorage.getAggregatedPeerFeedback(cycleId, userId);
      res.json(feedback);
    } catch (error) {
      handleError(res, error);
    }
  });

  // ==================== MANAGER EVALUATION ENDPOINT ALIASES ====================
  // These are aliases with different path formats for client compatibility

  // Get employee competencies (alias)
  app.get("/api/manager/employee-competencies/:userId", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const { userId } = req.params;
      const employee = await storage.getUser(userId);

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const competencies = await competenciesStorage.getCompetenciesByUserId(userId);
      res.json(competencies);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get employee self-assessment (alias)
  app.get("/api/manager/employee-self-assessment/:userId/:cycleId", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const { userId, cycleId } = req.params;
      const assessments = await competenciesStorage.getSelfAssessments(cycleId, userId);
      res.json(assessments);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get employee peer feedback (alias)
  app.get("/api/manager/employee-peer-feedback/:userId/:cycleId", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const { userId, cycleId } = req.params;
      const feedback = await competenciesStorage.getAggregatedPeerFeedback(cycleId, userId);
      res.json(feedback);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get my evaluations for an employee (alias)
  app.get("/api/manager/my-evaluations/:userId/:cycleId", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const { userId, cycleId } = req.params;
      const evaluations = await competenciesStorage.getManagerEvaluations(cycleId, userId);

      // Transform to match client expectations
      const transformed = evaluations.map(ev => ({
        id: ev.id,
        competencyId: ev.competencyId,
        rating: ev.rating,
        comment: ev.comment,
        submittedAt: ev.submittedAt,
      }));

      res.json(transformed);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create or update manager evaluation
  app.post("/api/manager/evaluations", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const data = insertManagerEvaluationSchema.parse({ ...req.body, managerUserId: managerId });
      const evaluation = await competenciesStorage.createOrUpdateManagerEvaluation(data);
      res.status(201).json(evaluation);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Submit manager evaluations (final submission)
  app.post("/api/manager/evaluations/:cycleId/submit", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const { employeeUserId } = req.body;
      if (!employeeUserId) {
        return res.status(400).json({ message: "employeeUserId is required" });
      }

      await competenciesStorage.submitManagerEvaluations(req.params.cycleId, employeeUserId, managerId);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // -------------------- Manager: Development Plans --------------------

  // Get development plans for my team
  app.get("/api/manager/development-plans/:cycleId", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const plans = await competenciesStorage.getDevelopmentPlansByManager(req.params.cycleId, managerId);
      res.json(plans);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create development plan
  app.post("/api/manager/development-plans", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const data = insertDevelopmentPlanSchema.parse({ ...req.body, managerUserId: managerId });
      const plan = await competenciesStorage.createDevelopmentPlan(data);
      res.status(201).json(plan);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update development plan
  app.patch("/api/manager/development-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      // Verify this plan was created by the requesting manager
      const plan = await competenciesStorage.getDevelopmentPlanById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Development plan not found" });
      }
      if (plan.managerUserId !== managerId && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - not your development plan" });
      }

      const data = insertDevelopmentPlanSchema.partial().parse(req.body);
      const updatedPlan = await competenciesStorage.updateDevelopmentPlan(req.params.id, data);
      res.json(updatedPlan);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update development plan status
  app.patch("/api/manager/development-plans/:id/status", isAuthenticated, async (req, res) => {
    try {
      const managerId = getUserId(req);
      const user = await storage.getUser(managerId);

      if (user?.role !== "manager" && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - manager access required" });
      }

      const { status } = req.body;
      if (!status || !["draft", "agreed", "in_progress", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Verify this plan was created by the requesting manager
      const plan = await competenciesStorage.getDevelopmentPlanById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Development plan not found" });
      }
      if (plan.managerUserId !== managerId && user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - not your development plan" });
      }

      const updatedPlan = await competenciesStorage.updateDevelopmentPlanStatus(req.params.id, status);
      res.json(updatedPlan);
    } catch (error) {
      handleError(res, error);
    }
  });

  // ==============================================
  // USER COMPETENCY MODEL ASSIGNMENTS
  // ==============================================

  // Get all competency model assignments for a user
  app.get("/api/users/:userId/competency-assignments", isAuthenticated, async (req, res) => {
    try {
      const assignments = await competenciesStorage.getUserCompetencyModelAssignments(req.params.userId);
      res.json(assignments);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get current (active) competency model assignment for a user
  app.get("/api/users/:userId/competency-assignments/current", isAuthenticated, async (req, res) => {
    try {
      const assignment = await competenciesStorage.getCurrentUserCompetencyModelAssignment(req.params.userId);
      res.json(assignment || null);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Assign a competency model to a user
  app.post("/api/users/:userId/competency-assignments", isAdmin, async (req, res) => {
    try {
      const assignedBy = getUserId(req);
      const data = insertUserCompetencyModelAssignmentSchema.parse({
        ...req.body,
        userId: req.params.userId,
        assignedBy,
      });
      const assignment = await competenciesStorage.createUserCompetencyModelAssignment(data);
      res.status(201).json(assignment);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update a competency model assignment
  app.patch("/api/users/:userId/competency-assignments/:assignmentId", isAdmin, async (req, res) => {
    try {
      const data = insertUserCompetencyModelAssignmentSchema.partial().parse(req.body);
      const assignment = await competenciesStorage.updateUserCompetencyModelAssignment(req.params.assignmentId, data);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Delete a competency model assignment
  app.delete("/api/users/:userId/competency-assignments/:assignmentId", isAdmin, async (req, res) => {
    try {
      await competenciesStorage.deleteUserCompetencyModelAssignment(req.params.assignmentId);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

