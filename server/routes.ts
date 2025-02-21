import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertServiceRequestSchema, 
  insertMechanicSchema,
  insertVehicleSchema,
  insertPaymentSchema,
  insertReviewSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Vehicle Management
  app.post("/api/vehicles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const data = insertVehicleSchema.parse({
      ...req.body,
      userId: req.user.id
    });
    const vehicle = await storage.createVehicle(data);
    res.status(201).json(vehicle);
  });

  app.get("/api/vehicles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const vehicles = await storage.getVehiclesByUser(req.user.id);
    res.json(vehicles);
  });

  // Service Requests
  app.post("/api/service-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== 'client') return res.sendStatus(403);

    const data = insertServiceRequestSchema.parse({
      ...req.body,
      clientId: req.user.id,
      status: 'pending'
    });
    const request = await storage.createServiceRequest(data);
    res.status(201).json(request);
  });

  app.get("/api/service-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const requests = await storage.getServiceRequests(req.user.id, req.user.role);
    res.json(requests);
  });

  app.patch("/api/service-requests/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const request = await storage.updateServiceRequest(
      parseInt(req.params.id),
      req.body
    );
    res.json(request);
  });

  // Mechanics
  app.post("/api/mechanics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== 'mechanic') return res.sendStatus(403);

    const data = insertMechanicSchema.parse({
      ...req.body,
      userId: req.user.id,
      approved: false
    });
    const mechanic = await storage.createMechanic(data);
    res.status(201).json(mechanic);
  });

  app.get("/api/mechanics/pending", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(403);
    const mechanics = await storage.getPendingMechanics();
    res.json(mechanics);
  });

  app.get("/api/mechanics/available", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const mechanics = await storage.getAvailableMechanics();
    res.json(mechanics);
  });

  app.patch("/api/mechanics/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(403);
    const mechanic = await storage.updateMechanic(
      parseInt(req.params.id),
      req.body
    );
    res.json(mechanic);
  });

  // Reviews and Ratings
  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const data = insertReviewSchema.parse({
      ...req.body,
      fromUserId: req.user.id
    });
    const review = await storage.createReview(data);
    res.status(201).json(review);
  });

  app.get("/api/reviews/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const reviews = await storage.getReviews(parseInt(req.params.userId));
    res.json(reviews);
  });

  // Payments
  app.post("/api/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const data = insertPaymentSchema.parse(req.body);
    const payment = await storage.createPayment(data);
    res.status(201).json(payment);
  });

  app.get("/api/payments/service/:requestId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const payments = await storage.getPaymentsByRequest(parseInt(req.params.requestId));
    res.json(payments);
  });

  app.get("/api/payments/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const payments = await storage.getUserPayments(req.user.id);
    res.json(payments);
  });

  const httpServer = createServer(app);
  return httpServer;
}