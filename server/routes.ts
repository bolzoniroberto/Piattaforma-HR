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
      await storage.upsertUser({
        id: demoUserId,
        email: `${role}@demo.local`,
        firstName: role === "admin" ? "Admin" : "Dipendente",
        lastName: "Demo",
        profileImageUrl: undefined,
        department: role === "admin" ? "Management" : "IT Development",
        ral: undefined,
        mboPercentage: 25,
      });

      // For demo employee, assign some objectives
      if (role === "employee") {
        try {
          // Get first few objectives (from objectives table, not dictionary) to assign
          const objectives = await storage.getObjectives();
          if (objectives.length > 0) {
            // Assign first 3 objectives to demo employee
            for (let i = 0; i < Math.min(3, objectives.length); i++) {
              const objective = objectives[i];
              
              try {
                await storage.createObjectiveAssignment({
                  userId: demoUserId,
                  objectiveId: objective.id,
                  status: "in_progress",
                  progress: Math.floor(Math.random() * 80),
                });
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
            profileImageUrl: undefined,
            department: demoRole === "admin" ? "Management" : "IT Development",
            role: demoRole,
            ral: undefined,
            mboPercentage: 25,
          });
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
      const data = insertObjectiveAssignmentSchema.parse(req.body);
      const assignment = await storage.createObjectiveAssignment(data);
      res.status(201).json(assignment);
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

  const httpServer = createServer(app);
  return httpServer;
}
