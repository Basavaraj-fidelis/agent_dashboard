
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Agent heartbeat endpoint
  app.post("/api/agents/:agentId/heartbeat", async (req, res) => {
    try {
      const { agentId } = req.params;
      const heartbeatData = req.body;

      // Create or update agent
      await storage.createOrUpdateAgent({
        agentId,
        hostname: heartbeatData.deviceName || heartbeatData.hostname,
        os: heartbeatData.os,
        location: heartbeatData.location,
        username: heartbeatData.username,
        lastHeartbeat: new Date(),
        status: "online"
      });

      // Insert heartbeat data
      await storage.insertHeartbeat({
        agentId,
        collectedAt: new Date(),
        localIp: heartbeatData.localIp,
        publicIp: heartbeatData.publicIp,
        location: heartbeatData.location
      });

      res.json({ success: true, message: "Heartbeat received" });
    } catch (error) {
      console.error("Error processing heartbeat:", error);
      res.status(500).json({ error: "Failed to process heartbeat" });
    }
  });

  // Agent full report endpoint
  app.post("/api/agents/:agentId/report", async (req, res) => {
    try {
      const { agentId } = req.params;
      const reportData = req.body;

      await storage.insertReport({
        agentId,
        reportType: "full_system_report",
        reportData,
        collectedAt: new Date()
      });

      res.json({ success: true, message: "Report received" });
    } catch (error) {
      console.error("Error processing report:", error);
      res.status(500).json({ error: "Failed to process report" });
    }
  });

  // Get all agents
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      
      // Calculate status based on last heartbeat
      const agentsWithStatus = agents.map(agent => {
        const lastHeartbeat = new Date(agent.lastHeartbeat);
        const now = new Date();
        const timeDiff = now.getTime() - lastHeartbeat.getTime();
        const minutesDiff = timeDiff / (1000 * 60);

        let status: "online" | "warning" | "offline";
        if (minutesDiff <= 10) {
          status = "online";
        } else if (minutesDiff <= 30) {
          status = "warning";
        } else {
          status = "offline";
        }

        return {
          ...agent,
          status
        };
      });

      res.json(agentsWithStatus);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  // Get specific agent with latest report
  app.get("/api/agents/:agentId", async (req, res) => {
    try {
      const { agentId } = req.params;
      
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const latestReport = await storage.getLatestReport(agentId, "full_system_report");
      const heartbeat = await storage.getLatestHeartbeat(agentId);

      res.json({
        ...agent,
        latestReport: latestReport?.reportData,
        heartbeat
      });
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  // Agent commands endpoint (for future use)
  app.get("/api/agents/:agentId/commands", async (req, res) => {
    try {
      const { agentId } = req.params;
      // For now, return empty commands array
      res.json({ commands: [] });
    } catch (error) {
      console.error("Error fetching commands:", error);
      res.status(500).json({ error: "Failed to fetch commands" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
