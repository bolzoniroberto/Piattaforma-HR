// Local development authentication (bypasses Replit Auth)
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import SQLiteStore from "better-sqlite3-session-store";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { sqlite } from "./db";
import { storage } from "./storage";

const isProd = process.env.NODE_ENV === "production";
// Quando true, gli utenti senza password impostata NON possono accedere.
// In sviluppo resta false per non bloccare gli account demo/legacy.
const requirePassword = process.env.REQUIRE_PASSWORD === "true";

// Limita i tentativi di login per mitigare brute-force.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Troppi tentativi di accesso. Riprova tra qualche minuto." },
});

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const SqliteSessionStore = SQLiteStore(session);
  const sessionStore = new SqliteSessionStore({
    client: sqlite,
    expired: {
      clear: true,
      intervalMs: 15 * 60 * 1000, // Clear expired sessions every 15 min
    },
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd, // cookie solo-HTTPS in produzione
      sameSite: "lax", // mitiga CSRF mantenendo la navigazione same-origin
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  // Numero di proxy davanti al server: 1 = solo il proxy dell'host,
  // 2 = rewrite Vercel + proxy dell'host (deploy ibrido).
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1));
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Simple local strategy that just checks if user exists
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Credenziali non valide" });
          }

          const hash = await storage.getPasswordHash(user.id);
          if (hash) {
            // Password impostata: verifica con bcrypt.
            const ok = await bcrypt.compare(password, hash);
            if (!ok) {
              return done(null, false, { message: "Credenziali non valide" });
            }
          } else if (requirePassword) {
            // Nessuna password e enforcement attivo: nega.
            return done(null, false, { message: "Password non impostata. Contatta l'amministratore." });
          }
          // Legacy (nessun hash, enforcement off): accesso consentito.

          return done(null, { id: user.id, email: user.email });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Local login endpoint (con rate-limit anti brute-force)
  app.post("/api/login", loginLimiter, passport.authenticate("local"), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  // Endpoint demo/dev: disponibili solo fuori produzione (espongono dati e bypassano auth).
  const devOnly: RequestHandler = (_req, res, next) => {
    if (isProd) return res.status(404).json({ message: "Not found" });
    next();
  };

  // Demo login endpoints for quick testing
  app.get("/api/demo-login/:role", devOnly, async (req, res) => {
    try {
      const role = req.params.role;
      if (role !== "admin" && role !== "employee") {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Get a demo user with the specified role
      const users = await storage.getAllUsers();
      const demoUser = users.find(u => u.role === role);

      if (!demoUser) {
        return res.status(404).json({ message: `No ${role} user found` });
      }

      // Log in the user
      req.login({ id: demoUser.id, email: demoUser.email }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.redirect("/");
      });
    } catch (error) {
      res.status(500).json({ message: "Error during demo login" });
    }
  });

  // List available users for local development
  app.get("/api/dev/users", devOnly, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        department: u.department,
        ral: u.ral,
        mboPercentage: u.mboPercentage,
        isActive: u.isActive
      })));
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const isManager: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return res.status(403).json({ message: "Forbidden - manager access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Allows admin OR users with isRendicontatore = true
export const canRendiconta: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user || (user.role !== "admin" && !user.isRendicontatore)) {
      return res.status(403).json({ message: "Forbidden - Rendicontatore access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
