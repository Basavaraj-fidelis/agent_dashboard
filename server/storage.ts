
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
    const connectedDevices = await this.getConnectedUsbDevices(agentId);
    const now = new Date();

    console.log(`[DEBUG] Processing USB changes for ${agentId}: Current=${currentDevices.length} devices, Previously connected=${connectedDevices.length} devices`);

    // Create a map of currently connected devices for quick lookup
    const currentDeviceMap = new Map(
      currentDevices.map(device => [device.DeviceID || device.deviceId, device])
    );

    // Create a map of previously connected devices for quick lookup
    const connectedDeviceMap = new Map(
      connectedDevices.map(device => [device.deviceId, device])
    );

    // Handle new USB devices (appeared in current but not in previous)
    for (const device of currentDevices) {
      const deviceId = device.DeviceID || device.deviceId;
      if (!connectedDeviceMap.has(deviceId)) {
        console.log(`[DEBUG] New USB device detected: ${deviceId} - ${device.Model || 'Unknown'}`);
        await this.insertUsbConnection({
          agentId,
          deviceId,
          deviceModel: device.Model || 'Unknown USB Device',
          sizeGb: device.SizeGB?.toString() || device.sizeGb?.toString() || null,
          status: 'connected',
          connectedAt: now,
          disconnectedAt: null
        });
      }
    }

    // Handle disconnected USB devices (missing in current but existed before & still marked connected)
    for (const connectedDevice of connectedDevices) {
      if (!currentDeviceMap.has(connectedDevice.deviceId)) {
        console.log(`[DEBUG] USB device disconnected: ${connectedDevice.deviceId} - ${connectedDevice.deviceModel}`);
        await this.disconnectUsbDevice(agentId, connectedDevice.deviceId);
      }
    }

    console.log(`[DEBUG] USB change processing completed for ${agentId}`);
  }
}

export const storage = new DatabaseStorage();
