import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import helmet from 'helmet';
import compression from 'compression';
import { rateLimiterMiddleware } from './middleware/rate-limiter';
import { cacheMiddleware, invalidateCache } from './middleware/cache';
import { errorHandler } from './middleware/error-handler';
import { logger } from './utils/logger';
import { 
  insertServiceRequestSchema, 
  insertMechanicSchema,
  insertVehicleSchema,
  insertPaymentSchema,
  insertReviewSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security headers with CSP configuration
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://maps.googleapis.com", "https://api.mapbox.com"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // Compression
  app.use(compression());

  // Rate limiting
  app.use(rateLimiterMiddleware);

  // Request logging with proper formatting
  app.use((req, res, next) => {
    logger.info({
      method: req.method,
      path: req.path,
      ip: req.ip,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
      headers: {
        'user-agent': req.headers['user-agent'],
        'accept-language': req.headers['accept-language'],
      }
    });
    next();
  });

  setupAuth(app);

  // Vehicle Management
  app.post("/api/vehicles", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const data = insertVehicleSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const vehicle = await storage.createVehicle(data);
      res.status(201).json(vehicle);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/vehicles", cacheMiddleware(300), async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const vehicles = await storage.getVehiclesByUser(req.user.id);
      res.json(vehicles);
    } catch (err) {
      next(err);
    }
  });

  // Service Requests with pagination
  app.get("/api/service-requests", cacheMiddleware(60), async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const requests = await storage.getServiceRequests(
        req.user.id, 
        req.user.role,
        limit,
        offset
      );

      res.json(requests);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/service-requests", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      if (req.user.role !== 'client') return res.sendStatus(403);

      const data = insertServiceRequestSchema.parse({
        ...req.body,
        clientId: req.user.id,
        status: 'pending'
      });
      const request = await storage.createServiceRequest(data);

      // Invalidate cache for service requests
      await invalidateCache('service-requests*');

      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/service-requests/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const request = await storage.updateServiceRequest(
        parseInt(req.params.id),
        req.body
      );
      res.json(request);
    } catch (err) {
      next(err);
    }
  });

  // Mechanics
  app.post("/api/mechanics", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      if (req.user.role !== 'mechanic') return res.sendStatus(403);

      const data = insertMechanicSchema.parse({
        ...req.body,
        userId: req.user.id,
        approved: false
      });
      const mechanic = await storage.createMechanic(data);
      res.status(201).json(mechanic);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/mechanics/pending", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(403);
      const mechanics = await storage.getPendingMechanics();
      res.json(mechanics);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/mechanics/available", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const mechanics = await storage.getAvailableMechanics();
      res.json(mechanics);
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/mechanics/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(403);
      const mechanic = await storage.updateMechanic(
        parseInt(req.params.id),
        req.body
      );
      res.json(mechanic);
    } catch (err) {
      next(err);
    }
  });

  // Reviews and Ratings
  app.post("/api/reviews", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const data = insertReviewSchema.parse({
        ...req.body,
        fromUserId: req.user.id
      });
      const review = await storage.createReview(data);
      res.status(201).json(review);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/reviews/:userId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const reviews = await storage.getReviews(parseInt(req.params.userId));
      res.json(reviews);
    } catch (err) {
      next(err);
    }
  });

  // Payments
  app.post("/api/payments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);

      const data = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(data);
      res.status(201).json(payment);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/payments/service/:requestId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const payments = await storage.getPaymentsByRequest(parseInt(req.params.requestId));
      res.json(payments);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/payments/user", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const payments = await storage.getUserPayments(req.user.id);
      res.json(payments);
    } catch (err) {
      next(err);
    }
  });

  // Add error handler last
  app.use(errorHandler);

  const httpServer = createServer(app);
  return httpServer;
}