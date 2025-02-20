import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertServiceRequestSchema, insertMechanicSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

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

  app.patch("/api/mechanics/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') return res.sendStatus(403);
    const mechanic = await storage.updateMechanic(
      parseInt(req.params.id),
      req.body
    );
    res.json(mechanic);
  });

  const httpServer = createServer(app);
  return httpServer;
}
