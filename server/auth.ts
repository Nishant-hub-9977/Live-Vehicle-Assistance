import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./vite";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true
    },
    name: 'roadside-assist.sid'
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username: string, password: string, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          log("Authentication failed for user: " + username);
          return done(null, false, { message: "Invalid username or password" });
        }
        log("Authentication successful for user: " + username);
        return done(null, user);
      } catch (error) {
        log("Authentication error: " + error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    log("Serializing user: " + user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        log("User not found during deserialization: " + id);
        return done(null, false);
      }
      log("Deserialized user: " + id);
      done(null, user);
    } catch (error) {
      log("Deserialization error: " + error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      log("Registration attempt for username: " + req.body.username);
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        log("Registration failed - username exists: " + req.body.username);
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      log("User registered successfully: " + user.id);
      req.login(user, (err) => {
        if (err) {
          log("Login after registration failed: " + err);
          return next(err);
        }
        res.status(201).json({ user, message: "Registration successful" });
      });
    } catch (error) {
      log("Registration error: " + error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    log("Login attempt for username: " + req.body.username);
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        log("Login error: " + err);
        return next(err);
      }
      if (!user) {
        log("Login failed for username: " + req.body.username);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          log("Session creation error: " + err);
          return next(err);
        }
        log("Login successful for user: " + user.id);
        res.status(200).json({ user, message: "Login successful" });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const userId = req.user?.id;
    log("Logout attempt for user: " + userId);
    req.logout((err) => {
      if (err) {
        log("Logout error for user " + userId + ": " + err);
        return next(err);
      }
      log("Logout successful for user: " + userId);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      log("Unauthorized access attempt to /api/user");
      return res.status(401).json({ message: "Not authenticated" });
    }
    log("User data retrieved for: " + req.user.id);
    res.json(req.user);
  });
}