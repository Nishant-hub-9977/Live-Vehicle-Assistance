import { IStorage } from "./types";
import { User, InsertUser, ServiceRequest, InsertServiceRequest, Mechanic, InsertMechanic } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, serviceRequests, mechanics } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [serviceRequest] = await db.insert(serviceRequests).values(request).returning();
    return serviceRequest;
  }

  async getServiceRequests(userId: number, role: string): Promise<ServiceRequest[]> {
    if (role === 'admin') {
      return await db.select().from(serviceRequests);
    }
    if (role === 'client') {
      return await db.select().from(serviceRequests).where(eq(serviceRequests.clientId, userId));
    }
    return await db.select().from(serviceRequests).where(eq(serviceRequests.mechanicId, userId));
  }

  async updateServiceRequest(id: number, updates: Partial<ServiceRequest>): Promise<ServiceRequest> {
    const [updated] = await db
      .update(serviceRequests)
      .set(updates)
      .where(eq(serviceRequests.id, id))
      .returning();
    if (!updated) throw new Error('Service request not found');
    return updated;
  }

  async createMechanic(mechanic: InsertMechanic): Promise<Mechanic> {
    const [newMechanic] = await db.insert(mechanics).values(mechanic).returning();
    return newMechanic;
  }

  async getMechanic(userId: number): Promise<Mechanic | undefined> {
    const [mechanic] = await db.select().from(mechanics).where(eq(mechanics.userId, userId));
    return mechanic;
  }

  async updateMechanic(id: number, updates: Partial<Mechanic>): Promise<Mechanic> {
    const [updated] = await db
      .update(mechanics)
      .set(updates)
      .where(eq(mechanics.id, id))
      .returning();
    if (!updated) throw new Error('Mechanic not found');
    return updated;
  }

  async getPendingMechanics(): Promise<Mechanic[]> {
    return await db.select().from(mechanics).where(eq(mechanics.approved, false));
  }
}

export const storage = new DatabaseStorage();