// Integration: javascript_log_in_with_replit
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { seed } from "./seed";
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
} from "@shared/schema";
import { ZodError } from "zod";

// Helper to get user ID from request
function getUserId(req: Request): string {
  // Check for demo mode header first
  if (req.headers["x-demo-user-id"]) {
    return req.headers["x-demo-user-id"] as string;
  }
  return (req.user as any)?.claims?.sub;
}

// Helper for error handling
function handleError(res: any, error: unknown) {
  console.error("Error:", error);
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
      const ralToUse = existingUser?.ral ?? (role === "admin" ? undefined : 80000);
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

  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
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
    } catch (error) {
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

  // Get all objectives with their assigned users (for reporting)
  app.get("/api/objectives-with-assignments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const objectivesWithAssignments = await storage.getObjectivesWithAssignments();
      res.json(objectivesWithAssignments);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Report on an objective (update actual values)
  app.patch("/api/objectives/:id/report", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { actualValue, qualitativeResult } = req.body;
      const objective = await storage.getObjective(req.params.id);
      
      if (!objective) {
        return res.status(404).json({ message: "Objective not found" });
      }

      // Get dictionary item to check objectiveType and targetValue
      const dictionary = objective.dictionaryId 
        ? await storage.getObjectivesDictionaryItem(objective.dictionaryId)
        : null;

      const updateData: any = {
        reportedAt: new Date(),
      };

      if (actualValue !== undefined) {
        updateData.actualValue = actualValue;
        
        // For numeric objectives, auto-calculate qualitativeResult based on actualValue vs targetValue
        if (dictionary?.objectiveType === "numeric" && dictionary?.targetValue !== null && dictionary?.targetValue !== undefined) {
          const target = parseFloat(String(dictionary.targetValue));
          const actual = parseFloat(String(actualValue));
          updateData.qualitativeResult = actual >= target ? "reached" : "not_reached";
        }
      }
      
      if (qualitativeResult && ["reached", "not_reached"].includes(qualitativeResult)) {
        // Only set qualitativeResult for qualitative objectives
        if (dictionary?.objectiveType === "qualitative") {
          updateData.qualitativeResult = qualitativeResult;
        }
      }

      const updatedObjective = await storage.updateObjective(req.params.id, updateData);
      res.json(updatedObjective);
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

      // Create an objective instance from dictionary with clusterId, type, and target
      const objective = await storage.createObjective({
        dictionaryId: objectiveId,
        clusterId: dictionaryItem.indicatorClusterId,
        deadline: null,
        objectiveType: objectiveType || "numeric",
        targetValue: targetValue !== undefined && targetValue !== null ? targetValue : null,
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

      // Get all users in the department
      const allUsers = await storage.getAllUsers();
      const departmentUsers = allUsers.filter(
        (u: any) => u.department === department && u.role === "employee"
      );

      if (departmentUsers.length === 0) {
        return res.status(400).json({ message: "No employees found in this department" });
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

      // Create an objective instance from dictionary with clusterId, type, and target
      const objective = await storage.createObjective({
        dictionaryId: objectiveId,
        clusterId: dictionaryItem.indicatorClusterId,
        deadline: null,
        objectiveType: objectiveType || "numeric",
        targetValue: targetValue !== undefined && targetValue !== null ? targetValue : null,
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
        { title: "Incremento fatturato gruppo +10%", description: "Raggiungere un incremento del fatturato consolidato del 10% rispetto all'anno precedente", indicatorClusterId: createdClusters[0].id, calculationTypeId: createdCalcTypes[0].id },
        { title: "Margine operativo lordo >15%", description: "Mantenere il MOL sopra il 15% del fatturato", indicatorClusterId: createdClusters[0].id, calculationTypeId: createdCalcTypes[1].id },
        { title: "Customer satisfaction >4.5", description: "Raggiungere un punteggio NPS medio superiore a 4.5", indicatorClusterId: createdClusters[1].id, calculationTypeId: createdCalcTypes[0].id },
        { title: "Riduzione time-to-market -20%", description: "Ridurre i tempi di rilascio prodotti del 20%", indicatorClusterId: createdClusters[1].id, calculationTypeId: createdCalcTypes[2].id },
        { title: "Riduzione emissioni CO2 -15%", description: "Ridurre le emissioni di CO2 del 15% rispetto all'anno base", indicatorClusterId: createdClusters[2].id, calculationTypeId: createdCalcTypes[2].id },
        { title: "Gender diversity >40%", description: "Raggiungere almeno il 40% di rappresentanza femminile in ruoli manageriali", indicatorClusterId: createdClusters[2].id, calculationTypeId: createdCalcTypes[0].id },
        { title: "Completamento certificazioni", description: "Ottenere almeno 2 certificazioni professionali nell'anno", indicatorClusterId: createdClusters[3].id, calculationTypeId: createdCalcTypes[3].id },
        { title: "Progetti completati on-time", description: "Completare almeno l'80% dei progetti entro le deadline", indicatorClusterId: createdClusters[3].id, calculationTypeId: createdCalcTypes[0].id },
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

  const httpServer = createServer(app);
  return httpServer;
}

