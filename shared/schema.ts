import { pgTable, text, serial, integer, boolean, jsonb, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced user profiles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'client' | 'mechanic' | 'admin'
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  location: jsonb("location").$type<{lat: number, lng: number}>(),
  verificationStatus: text("verification_status").default('pending'), // 'pending' | 'verified' | 'rejected'
  rating: decimal("rating").default('0'),
  totalRatings: integer("total_ratings").default(0),
  created: timestamp("created").notNull().defaultNow(),
  lastActive: timestamp("last_active"),
});

// Vehicle information
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'car' | 'motorcycle' | 'truck' | 'van'
  make: text("make"),
  model: text("model"),
  year: text("year"),
  licensePlate: text("license_plate"),
  created: timestamp("created").notNull().defaultNow(),
});

// Enhanced service requests
export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  mechanicId: integer("mechanic_id"),
  vehicleId: integer("vehicle_id"),
  status: text("status").notNull(), // 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  serviceType: text("service_type").notNull(), // 'breakdown' | 'tire' | 'battery' | 'fuel' | 'tow'
  urgencyLevel: text("urgency_level").notNull(), // 'normal' | 'urgent' | 'emergency'
  location: jsonb("location").$type<{lat: number, lng: number}>().notNull(),
  description: text("description").notNull(),
  estimatedPrice: decimal("estimated_price"),
  finalPrice: decimal("final_price"),
  paymentStatus: text("payment_status"), // 'pending' | 'paid' | 'refunded'
  paymentMethod: text("payment_method"), // 'cash' | 'card' | 'upi'
  route: jsonb("route").$type<{
    distance: number,
    duration: number,
    path: Array<{lat: number, lng: number}>
  }>(),
  created: timestamp("created").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
});

// Enhanced mechanic profiles
export const mechanics = pgTable("mechanics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  approved: boolean("approved").notNull().default(false),
  specializations: jsonb("specializations").$type<string[]>(), // ['electrical', 'mechanical', 'towing']
  documents: jsonb("documents").$type<Array<{
    type: string,
    url: string,
    verified: boolean
  }>>(),
  availability: boolean("availability").default(true),
  activeLocation: jsonb("active_location").$type<{lat: number, lng: number}>(),
  experience: integer("experience"), // years of experience
  totalJobs: integer("total_jobs").default(0),
  completedJobs: integer("completed_jobs").default(0),
  averageResponseTime: integer("average_response_time"), // in minutes
  created: timestamp("created").notNull().defaultNow(),
});

// Ratings and reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  serviceRequestId: integer("service_request_id").notNull(),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  created: timestamp("created").notNull().defaultNow(),
});

// Payment tracking
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  serviceRequestId: integer("service_request_id").notNull(),
  amount: decimal("amount").notNull(),
  status: text("status").notNull(), // 'pending' | 'completed' | 'failed' | 'refunded'
  method: text("method").notNull(), // 'cash' | 'card' | 'upi'
  transactionId: text("transaction_id"),
  created: timestamp("created").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertVehicleSchema = createInsertSchema(vehicles);
export const insertServiceRequestSchema = createInsertSchema(serviceRequests);
export const insertMechanicSchema = createInsertSchema(mechanics);
export const insertReviewSchema = createInsertSchema(reviews);
export const insertPaymentSchema = createInsertSchema(payments);

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type Mechanic = typeof mechanics.$inferSelect;
export type InsertMechanic = z.infer<typeof insertMechanicSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;