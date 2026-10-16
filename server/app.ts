import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { registerRoutes } from "./routes";
import { seed } from "./seed";
import { storage } from "./storage";
import { initializeDatabase } from "./db";
import { seedDefaultFieldMappings } from "./docGenRoutes";
import { validateEnv } from "./config";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

// Header di sicurezza. CSP disabilitata: la SPA Vite/React usa script/stili
// inline che una CSP di default bloccherebbe (va definita a parte con le nonce).
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limit generale sulle API per mitigare abusi/scraping.
// Il login ha un limite più stretto dedicato (vedi localAuth.ts).
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Troppe richieste. Riprova più tardi." },
  }),
);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  try {
    validateEnv();
  } catch (error) {
    log(`${error instanceof Error ? error.message : error}`, "config");
    process.exit(1);
  }

  try {
    initializeDatabase();
  } catch (error) {
    log(`Failed to initialize database: ${error}`, "database");
    process.exit(1);
  }

  const server = await registerRoutes(app);

  // Semina i mapping di default doc-gen (idempotente, non sovrascrive l'esistente)
  seedDefaultFieldMappings().catch((e) => console.error("Seed field mappings error:", e));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Start listening IMMEDIATELY so health checks can pass
  // while setup continues in the background
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

  // Run setup in background after server is listening
  // This prevents health checks from timing out during setup
  setup(app, server).catch((error) => {
    console.error("Setup error:", error);
  });

  // Seeding is now manual-only via POST /api/admin/seed to prevent duplicate data
  // This ensures the database never gets accidentally re-seeded on hot reloads
}
