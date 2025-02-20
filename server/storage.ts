import { IStorage } from "./types";
import { User, InsertUser, ServiceRequest, InsertServiceRequest, Mechanic, InsertMechanic } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private serviceRequests: Map<number, ServiceRequest>;
  private mechanics: Map<number, Mechanic>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.serviceRequests = new Map();
    this.mechanics = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const id = this.currentId++;
    const serviceRequest: ServiceRequest = { ...request, id };
    this.serviceRequests.set(id, serviceRequest);
    return serviceRequest;
  }

  async getServiceRequests(userId: number, role: string): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values()).filter(request => {
      if (role === 'client') return request.clientId === userId;
      if (role === 'mechanic') return request.mechanicId === userId;
      return true; // admin sees all
    });
  }

  async updateServiceRequest(id: number, updates: Partial<ServiceRequest>): Promise<ServiceRequest> {
    const existing = this.serviceRequests.get(id);
    if (!existing) throw new Error('Service request not found');
    const updated = { ...existing, ...updates };
    this.serviceRequests.set(id, updated);
    return updated;
  }

  async createMechanic(mechanic: InsertMechanic): Promise<Mechanic> {
    const id = this.currentId++;
    const newMechanic: Mechanic = { ...mechanic, id };
    this.mechanics.set(id, newMechanic);
    return newMechanic;
  }

  async getMechanic(userId: number): Promise<Mechanic | undefined> {
    return Array.from(this.mechanics.values()).find(
      (mechanic) => mechanic.userId === userId,
    );
  }

  async updateMechanic(id: number, updates: Partial<Mechanic>): Promise<Mechanic> {
    const existing = this.mechanics.get(id);
    if (!existing) throw new Error('Mechanic not found');
    const updated = { ...existing, ...updates };
    this.mechanics.set(id, updated);
    return updated;
  }

  async getPendingMechanics(): Promise<Mechanic[]> {
    return Array.from(this.mechanics.values()).filter(
      (mechanic) => !mechanic.approved,
    );
  }
}

export const storage = new MemStorage();
