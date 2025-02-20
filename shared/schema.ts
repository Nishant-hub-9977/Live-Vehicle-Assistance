import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'client' | 'mechanic' | 'admin'
  location: jsonb("location").$type<{lat: number, lng: number}>(),
});

export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  mechanicId: integer("mechanic_id"),
  status: text("status").notNull(), // 'pending' | 'accepted' | 'completed'
  location: jsonb("location").$type<{lat: number, lng: number}>().notNull(),
  description: text("description").notNull(),
  created: timestamp("created").notNull().defaultNow(),
});

export const mechanics = pgTable("mechanics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  approved: boolean("approved").notNull().default(false),
  documents: jsonb("documents").$type<string[]>(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertServiceRequestSchema = createInsertSchema(serviceRequests);
export const insertMechanicSchema = createInsertSchema(mechanics);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type Mechanic = typeof mechanics.$inferSelect;
export type InsertMechanic = z.infer<typeof insertMechanicSchema>;
