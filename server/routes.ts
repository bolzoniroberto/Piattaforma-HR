// Integration: javascript_log_in_with_replit
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { seed } from "./seed";
import {
  insertIndicatorClusterSchema,
  insertCalculationTypeSchema,
  insertObjectivesDictionarySchema,
  insertObjectiveClusterSchema,
  insertObjectiveSchema,
  insertObjectiveAssignmentSchema,
  insertDocumentSchema,
  insertDocumentAcceptanceSchema,
} from "@shared/schema";
import { ZodError } from "zod";

// Helper to get user ID from request
function getUserId(req: Request): string {
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

  // Seed database on first run (if empty)
  try {
    const clusters = await storage.getIndicatorClusters();
    if (clusters.length === 0) {
      console.log("📊 Database is empty, running seed...");
      await seed();
    }
  } catch (error) {
    console.error("⚠️  Could not check/seed database:", error);
  }

  // Health check - no auth required
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
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

  // Objective Cluster routes
  app.get("/api/clusters", isAuthenticated, async (req, res) => {
    try {
      const clusters = await storage.getObjectiveClusters();
      res.json(clusters);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/clusters/:id", isAuthenticated, async (req, res) => {
    try {
      const cluster = await storage.getObjectiveCluster(req.params.id);
      if (!cluster) {
        return res.status(404).json({ message: "Cluster not found" });
      }
      res.json(cluster);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/clusters", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertObjectiveClusterSchema.parse(req.body);
      const cluster = await storage.createObjectiveCluster(data);
      res.status(201).json(cluster);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/clusters/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertObjectiveClusterSchema.partial().parse(req.body);
      const cluster = await storage.updateObjectiveCluster(req.params.id, data);
      res.json(cluster);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/clusters/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteObjectiveCluster(req.params.id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // Objective routes
  app.get("/api/objectives", isAuthenticated, async (req, res) => {
    try {
      const { clusterId } = req.query;
      const objectives = clusterId
        ? await storage.getObjectivesByCluster(clusterId as string)
        : await storage.getObjectives();
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
      const clusterStats = await storage.getClusterStats(userId);
      res.json({ ...stats, clusterStats });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/stats/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.params.userId);
      const clusterStats = await storage.getClusterStats(req.params.userId);
      res.json({ ...stats, clusterStats });
    } catch (error) {
      handleError(res, error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
