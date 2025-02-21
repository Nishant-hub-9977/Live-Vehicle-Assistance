import { IStorage } from "./types";
import { db } from "./db";
import { and, eq } from "drizzle-orm";
import { users, serviceRequests, mechanics, vehicles, payments, reviews } from "@shared/schema";
import type { User, InsertUser, ServiceRequest, InsertServiceRequest, Mechanic, InsertMechanic, Vehicle, InsertVehicle, Payment, InsertPayment, Review, InsertReview } from "@shared/schema";
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

  // User Management
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

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    if (!updated) throw new Error('User not found');
    return updated;
  }

  // Vehicle Management
  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async getVehiclesByUser(userId: number): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.userId, userId));
  }

  // Service Requests
  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [serviceRequest] = await db.insert(serviceRequests).values(request).returning();
    return serviceRequest;
  }

  async getServiceRequests(userId: number, role: string): Promise<ServiceRequest[]> {
    if (role === 'admin') {
      return await db.select().from(serviceRequests);
    }
    const field = role === 'client' ? serviceRequests.clientId : serviceRequests.mechanicId;
    return await db.select().from(serviceRequests).where(eq(field, userId));
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

  // Mechanic Management
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

  async getAvailableMechanics(): Promise<Mechanic[]> {
    return await db.select().from(mechanics).where(
      and(
        eq(mechanics.approved, true),
        eq(mechanics.availability, true)
      )
    );
  }

  // Reviews and Ratings
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getReviews(userId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.toUserId, userId));
  }

  // Payment Tracking
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentsByRequest(requestId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.serviceRequestId, requestId));
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    const userRequests = await this.getServiceRequests(userId, 'client');
    if (!userRequests.length) return [];
    const requestIds = userRequests.map(req => req.id);
    return await db
      .select()
      .from(payments)
      .where(
        eq(payments.serviceRequestId, requestIds[0])
      );
  }
}

export const storage = new DatabaseStorage();