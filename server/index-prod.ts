import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

import express, { type Express } from "express";
import runApp from "./app";

export async function serveStatic(app: Express, _server: Server) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Pre-load index.html for fast serving to health checks and SPA routing
  const indexHtmlPath = path.resolve(distPath, "index.html");
  let indexHtmlContent: Buffer;
  
  try {
    indexHtmlContent = fs.readFileSync(indexHtmlPath);
  } catch (error) {
    throw new Error(`Could not read index.html from ${indexHtmlPath}`);
  }

  app.use(express.static(distPath));

  // Root endpoint - serve cached index.html for health checks and SPA routing
  app.get("/", (_req, res) => {
    res.type("text/html").send(indexHtmlContent);
  });

  // fall through to index.html if the file doesn't exist
  // but exclude /api routes to avoid serving index.html for API calls
  app.use("*", (req, res) => {
    // Don't serve index.html for API routes - let them 404
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not found" });
    }
    res.type("text/html").send(indexHtmlContent);
  });
}

(async () => {
  await runApp(serveStatic);
})();
