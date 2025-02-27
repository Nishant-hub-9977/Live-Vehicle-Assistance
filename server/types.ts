import type { Store } from "express-session";
import type { User, InsertUser, ServiceRequest, InsertServiceRequest, Mechanic, InsertMechanic, Vehicle, InsertVehicle, Payment, InsertPayment, Review, InsertReview } from "@shared/schema";

export interface IStorage {
  sessionStore: Store;

  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  // Vehicle Management
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehiclesByUser(userId: number): Promise<Vehicle[]>;

  // Service Requests with Pagination
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  getServiceRequests(userId: number, role: string, limit?: number, offset?: number): Promise<{
    data: ServiceRequest[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  updateServiceRequest(id: number, updates: Partial<ServiceRequest>): Promise<ServiceRequest>;

  // Mechanic Management
  createMechanic(mechanic: InsertMechanic): Promise<Mechanic>;
  getMechanic(userId: number): Promise<Mechanic | undefined>;
  updateMechanic(id: number, updates: Partial<Mechanic>): Promise<Mechanic>;
  getPendingMechanics(): Promise<Mechanic[]>;
  getAvailableMechanics(limit?: number, offset?: number): Promise<{
    data: Mechanic[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  // Reviews and Ratings
  createReview(review: InsertReview): Promise<Review>;
  getReviews(userId: number, limit?: number, offset?: number): Promise<{
    data: Review[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  // Payment Tracking
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByRequest(requestId: number): Promise<Payment[]>;
  getUserPayments(userId: number, limit?: number, offset?: number): Promise<{
    data: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}