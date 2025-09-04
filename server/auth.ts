import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import session from "express-session";
import cors from "cors";
import { storage } from "./storage";


declare global {
  namespace Express {
    interface UserClaims {
      sub: string;
    }
    interface Request {
      user?: {
        claims: UserClaims;
        access_token?: string;
        refresh_token?: string | null;
        expires_at?: number;
      };
    }
  }
}

// ✅ Extend express-session.SessionData
declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
    };
  }
}

// Middleware to check authentication
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Auth setup function
export async function setupAuth(app: any) {
  // CORS: allow frontend to send cookies
  app.use(
    cors({
      origin: "http://localhost:3000", // adjust to your frontend URL
      credentials: true,
    })
  );

  // Sessions
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "super-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  // Login route
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Attach user to session
      req.session.user = { id: user.id };

      res.json({ message: "Login successful", user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Register route
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await storage.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
      });

      // Attach new user to session
      req.session.user = { id: newUser.id };

      res.json({ message: "User registered successfully", user: newUser });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Current user route
  app.get("/api/auth/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });
}
