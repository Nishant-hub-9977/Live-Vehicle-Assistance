import { IStorage } from "./types";
import { db } from "./db";
import { and, eq, sql } from "drizzle-orm";
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

  // Service Requests with Pagination
  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [serviceRequest] = await db.insert(serviceRequests)
      .values([request])  // Wrap in array to match expected type
      .returning();
    return serviceRequest;
  }

  async getServiceRequests(userId: number, role: string, limit = 10, offset = 0): Promise<{
    data: ServiceRequest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const field = role === 'client' ? serviceRequests.clientId : serviceRequests.mechanicId;
    const condition = role === 'admin' ? sql`TRUE` : eq(field, userId);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceRequests)
      .where(condition);

    const data = await db
      .select()
      .from(serviceRequests)
      .where(condition)
      .limit(limit)
      .offset(offset)
      .orderBy(serviceRequests.created);

    return {
      data,
      total: count,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit)
    };
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
    const [newMechanic] = await db.insert(mechanics)
      .values([mechanic])  // Wrap in array to match expected type
      .returning();
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
    const result = await db
      .select()
      .from(mechanics)
      .where(eq(mechanics.approved, false));
    return result;
  }

  async getAvailableMechanics(limit = 10, offset = 0): Promise<{
    data: Mechanic[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mechanics)
      .where(
        and(
          eq(mechanics.approved, true),
          eq(mechanics.availability, true)
        )
      );

    const data = await db
      .select()
      .from(mechanics)
      .where(
        and(
          eq(mechanics.approved, true),
          eq(mechanics.availability, true)
        )
      )
      .limit(limit)
      .offset(offset)
      .orderBy(mechanics.created);

    return {
      data,
      total: count,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit)
    };
  }


  // Reviews and Ratings
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getReviews(userId: number, limit = 10, offset = 0): Promise<{
    data: Review[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.toUserId, userId));

    const data = await db
      .select()
      .from(reviews)
      .where(eq(reviews.toUserId, userId))
      .limit(limit)
      .offset(offset)
      .orderBy(reviews.created);

    return {
      data,
      total: count,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit)
    };
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
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.serviceRequestId, requestId));
    return result;
  }

  async getUserPayments(userId: number, limit = 10, offset = 0): Promise<{
    data: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const userRequests = await this.getServiceRequests(userId, 'client');
    if (!userRequests.data.length) return { data: [], total: 0, page: 1, totalPages: 0 };
    const requestIds = userRequests.data.map(req => req.id);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(
        sql`serviceRequestId IN (${sql.join(requestIds, ',')})`
      );
    const data = await db
      .select()
      .from(payments)
      .where(
        sql`serviceRequestId IN (${sql.join(requestIds, ',')})`
      )
      .limit(limit)
      .offset(offset)
      .orderBy(payments.created);

    return {
      data,
      total: count,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit)
    };
  }
}

export const storage = new DatabaseStorage();