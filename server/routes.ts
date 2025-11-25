// Integration: javascript_log_in_with_replit
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
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

  app.post("/api/clusters", isAuthenticated, async (req, res) => {
    try {
      const data = insertObjectiveClusterSchema.parse(req.body);
      const cluster = await storage.createObjectiveCluster(data);
      res.status(201).json(cluster);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/clusters/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertObjectiveClusterSchema.partial().parse(req.body);
      const cluster = await storage.updateObjectiveCluster(req.params.id, data);
      res.json(cluster);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/clusters/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/objectives", isAuthenticated, async (req, res) => {
    try {
      const data = insertObjectiveSchema.parse(req.body);
      const objective = await storage.createObjective(data);
      res.status(201).json(objective);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/objectives/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertObjectiveSchema.partial().parse(req.body);
      const objective = await storage.updateObjective(req.params.id, data);
      res.json(objective);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/objectives/:id", isAuthenticated, async (req, res) => {
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

  app.get("/api/assignments/:userId", isAuthenticated, async (req, res) => {
    try {
      const assignments = await storage.getObjectiveAssignments(req.params.userId);
      res.json(assignments);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/assignments", isAuthenticated, async (req, res) => {
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
      const data = insertObjectiveAssignmentSchema.partial().parse(req.body);
      const assignment = await storage.updateObjectiveAssignment(req.params.id, data);
      res.json(assignment);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/assignments/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const data = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(data);
      res.status(201).json(document);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(req.params.id, data);
      res.json(document);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
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

  app.get("/api/stats/:userId", isAuthenticated, async (req, res) => {
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
