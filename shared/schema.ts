import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const agents = pgTable("agents", {
  agentId: varchar("agent_id").primaryKey(),
  hostname: text("hostname").notNull(),
  os: text("os").notNull(),
  location: text("location").notNull(),
  username: text("username").notNull(),
  lastHeartbeat: timestamp("last_heartbeat").notNull(),
  status: text("status").notNull().default("offline"),
});

export const heartbeatCurrent = pgTable("heartbeat_current", {
  agentId: varchar("agent_id").primaryKey().references(() => agents.agentId),
  collectedAt: timestamp("collected_at").notNull(),
  localIp: text("local_ip"),
  publicIp: text("public_ip"),
  location: text("location"),
});

export const heartbeatHistory = pgTable("heartbeat_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.agentId),
  collectedAt: timestamp("collected_at").notNull(),
  localIp: text("local_ip"),
  publicIp: text("public_ip"),
  location: text("location"),
});

export const agentReports = pgTable("agent_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.agentId),
  reportType: text("report_type").notNull(),
  reportData: jsonb("report_data").notNull(),
  collectedAt: timestamp("collected_at").notNull(),
});

export const usbConnectionHistory = pgTable("usb_connection_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.agentId),
  deviceId: text("device_id").notNull(), // DeviceID from USB device
  deviceModel: text("device_model").notNull(), // Model name
  sizeGb: text("size_gb"), // Size in GB
  status: text("status").notNull(), // 'connected' or 'disconnected'
  connectedAt: timestamp("connected_at").notNull(),
  disconnectedAt: timestamp("disconnected_at"), // NULL if still connected
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAgentSchema = createInsertSchema(agents);
export const insertHeartbeatSchema = createInsertSchema(heartbeatCurrent);
export const insertReportSchema = createInsertSchema(agentReports);
export const insertUsbHistorySchema = createInsertSchema(usbConnectionHistory);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type HeartbeatCurrent = typeof heartbeatCurrent.$inferSelect;
export type InsertHeartbeat = z.infer<typeof insertHeartbeatSchema>;
export type AgentReport = typeof agentReports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type UsbConnectionHistory = typeof usbConnectionHistory.$inferSelect;
export type InsertUsbHistory = z.infer<typeof insertUsbHistorySchema>;
