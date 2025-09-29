
import { type User, type InsertUser, type Agent, type InsertAgent, type HeartbeatCurrent, type InsertHeartbeat, type AgentReport, type InsertReport } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, agents, heartbeatCurrent, heartbeatHistory, agentReports } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Agent methods
  getAllAgents(): Promise<Agent[]>;
  getAgent(agentId: string): Promise<Agent | undefined>;
  createOrUpdateAgent(agent: InsertAgent): Promise<Agent>;
  updateAgentStatus(agentId: string, status: string): Promise<void>;
  
  // Heartbeat methods
  insertHeartbeat(heartbeat: InsertHeartbeat): Promise<void>;
  getLatestHeartbeat(agentId: string): Promise<HeartbeatCurrent | undefined>;
  
  // Report methods
  insertReport(report: InsertReport): Promise<void>;
  getLatestReport(agentId: string, reportType: string): Promise<AgentReport | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id)
    });
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username)
    });
    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Agent methods
  async getAllAgents(): Promise<Agent[]> {
    return await db.select().from(agents).orderBy(desc(agents.lastHeartbeat));
  }

  async getAgent(agentId: string): Promise<Agent | undefined> {
    const result = await db.query.agents.findFirst({
      where: eq(agents.agentId, agentId)
    });
    return result;
  }

  async createOrUpdateAgent(agent: InsertAgent): Promise<Agent> {
    const [result] = await db.insert(agents)
      .values(agent)
      .onConflictDoUpdate({
        target: agents.agentId,
        set: {
          hostname: agent.hostname,
          os: agent.os,
          location: agent.location,
          username: agent.username,
          lastHeartbeat: agent.lastHeartbeat,
          status: agent.status || "online"
        }
      })
      .returning();
    return result;
  }

  async updateAgentStatus(agentId: string, status: string): Promise<void> {
    await db.update(agents)
      .set({ status })
      .where(eq(agents.agentId, agentId));
  }

  // Heartbeat methods
  async insertHeartbeat(heartbeat: InsertHeartbeat): Promise<void> {
    // Insert into current heartbeat (upsert)
    await db.insert(heartbeatCurrent)
      .values(heartbeat)
      .onConflictDoUpdate({
        target: heartbeatCurrent.agentId,
        set: {
          collectedAt: heartbeat.collectedAt,
          localIp: heartbeat.localIp,
          publicIp: heartbeat.publicIp,
          location: heartbeat.location
        }
      });

    // Insert into history
    await db.insert(heartbeatHistory).values({
      agentId: heartbeat.agentId,
      collectedAt: heartbeat.collectedAt,
      localIp: heartbeat.localIp,
      publicIp: heartbeat.publicIp,
      location: heartbeat.location
    });
  }

  async getLatestHeartbeat(agentId: string): Promise<HeartbeatCurrent | undefined> {
    const result = await db.query.heartbeatCurrent.findFirst({
      where: eq(heartbeatCurrent.agentId, agentId)
    });
    return result;
  }

  // Report methods
  async insertReport(report: InsertReport): Promise<void> {
    await db.insert(agentReports).values(report);
  }

  async getLatestReport(agentId: string, reportType: string): Promise<AgentReport | undefined> {
    const result = await db.query.agentReports.findFirst({
      where: (reports, { eq, and }) => and(
        eq(reports.agentId, agentId),
        eq(reports.reportType, reportType)
      ),
      orderBy: (reports, { desc }) => desc(reports.collectedAt)
    });
    return result;
  }
}

export const storage = new DatabaseStorage();
