
import { type User, type InsertUser, type Agent, type InsertAgent, type HeartbeatCurrent, type InsertHeartbeat, type AgentReport, type InsertReport, type UsbConnectionHistory, type InsertUsbHistory } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, agents, heartbeatCurrent, heartbeatHistory, agentReports, usbConnectionHistory } from "@shared/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

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
  
  // USB Connection History methods
  getConnectedUsbDevices(agentId: string): Promise<UsbConnectionHistory[]>;
  insertUsbConnection(usbHistory: InsertUsbHistory): Promise<void>;
  disconnectUsbDevice(agentId: string, deviceId: string): Promise<void>;
  getUsbConnectionHistory(agentId: string): Promise<UsbConnectionHistory[]>;
  processUsbDeviceChanges(agentId: string, currentDevices: any[]): Promise<void>;
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

  // USB Connection History methods
  async getConnectedUsbDevices(agentId: string): Promise<UsbConnectionHistory[]> {
    return await db.select()
      .from(usbConnectionHistory)
      .where(
        and(
          eq(usbConnectionHistory.agentId, agentId),
          eq(usbConnectionHistory.status, 'connected'),
          isNull(usbConnectionHistory.disconnectedAt)
        )
      );
  }

  async insertUsbConnection(usbHistory: InsertUsbHistory): Promise<void> {
    await db.insert(usbConnectionHistory).values(usbHistory);
  }

  async disconnectUsbDevice(agentId: string, deviceId: string): Promise<void> {
    await db.update(usbConnectionHistory)
      .set({ 
        status: 'disconnected',
        disconnectedAt: new Date()
      })
      .where(
        and(
          eq(usbConnectionHistory.agentId, agentId),
          eq(usbConnectionHistory.deviceId, deviceId),
          eq(usbConnectionHistory.status, 'connected'),
          isNull(usbConnectionHistory.disconnectedAt)
        )
      );
  }

  async getUsbConnectionHistory(agentId: string): Promise<UsbConnectionHistory[]> {
    return await db.select()
      .from(usbConnectionHistory)
      .where(eq(usbConnectionHistory.agentId, agentId))
      .orderBy(desc(usbConnectionHistory.connectedAt));
  }

  async processUsbDeviceChanges(agentId: string, currentDevices: any[]): Promise<void> {
    const now = new Date();
    const hasUsbConnected = currentDevices && currentDevices.length > 0;

    console.log(`[DEBUG] Processing USB state for ${agentId}: Current state=${hasUsbConnected ? 'USB Connected' : 'No USB'} (${currentDevices.length} devices)`);

    // Get the most recent USB connection record for this agent
    const lastRecord = await db.select()
      .from(usbConnectionHistory)
      .where(eq(usbConnectionHistory.agentId, agentId))
      .orderBy(desc(usbConnectionHistory.connectedAt))
      .limit(1);

    const previousState = lastRecord.length > 0 && lastRecord[0].status === 'connected' && !lastRecord[0].disconnectedAt;

    console.log(`[DEBUG] Previous state: ${previousState ? 'USB Connected' : 'No USB'}`);

    // Apply the proposed logic
    if (hasUsbConnected) {
      // Current heartbeat = "USB Connected"
      if (!previousState) {
        // Previous state was "No USB" → Insert new record
        console.log(`[DEBUG] State change: No USB → USB Connected - Inserting new connection record`);
        await this.insertUsbConnection({
          agentId,
          deviceId: `USB_SESSION_${Date.now()}`, // Use session-based ID since we're not tracking individual devices
          deviceModel: `USB Storage (${currentDevices.length} device${currentDevices.length > 1 ? 's' : ''})`,
          sizeGb: null,
          status: 'connected',
          connectedAt: now,
          disconnectedAt: null
        });
      } else {
        // Previous state also "USB Connected" → do nothing
        console.log(`[DEBUG] State unchanged: USB Connected → USB Connected - No action needed`);
      }
    } else {
      // Current heartbeat = "No USB"
      if (previousState) {
        // Previous state was "USB Connected" → Update last record with disconnected_at
        console.log(`[DEBUG] State change: USB Connected → No USB - Marking as disconnected`);
        await db.update(usbConnectionHistory)
          .set({ 
            status: 'disconnected',
            disconnectedAt: now
          })
          .where(
            and(
              eq(usbConnectionHistory.agentId, agentId),
              eq(usbConnectionHistory.status, 'connected'),
              isNull(usbConnectionHistory.disconnectedAt)
            )
          );
      } else {
        // Previous state already "No USB" → do nothing
        console.log(`[DEBUG] State unchanged: No USB → No USB - No action needed`);
      }
    }

    console.log(`[DEBUG] USB state processing completed for ${agentId}`);
  }
}

export const storage = new DatabaseStorage();
