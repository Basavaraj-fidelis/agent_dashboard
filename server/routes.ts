import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Agent heartbeat endpoint
  app.post("/api/agents/:agentId/heartbeat", async (req, res) => {
    try {
      const { agentId } = req.params;
      const heartbeatData = req.body;

      console.log(`[DEBUG] Received heartbeat from agent ${agentId}:`, JSON.stringify(heartbeatData, null, 2));

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

      // Store system information from heartbeat as a report (if available)
      if (heartbeatData.cpu || heartbeatData.ram || heartbeatData.graphics) {
        console.log(`[DEBUG] Creating system_info_heartbeat report for agent ${agentId}`);
        const systemInfoReport = {
          system_info: {
            SystemInfo: {
              cpu: heartbeatData.cpu || "Unknown",
              ram: heartbeatData.ram || "Unknown", 
              graphics: heartbeatData.graphics || "Unknown",
              total_disk: "Information available in full system report"
            },
            NetworkInfo: {
              local_ip: heartbeatData.localIp || "Unknown",
              public_ip: heartbeatData.publicIp || "Unknown",
              location: heartbeatData.location || "Unknown",
              nic_details: []
            }
          },
          source: "heartbeat",
          timestamp: new Date().toISOString()
        };

        try {
          await storage.insertReport({
            agentId,
            reportType: "system_info_heartbeat",
            reportData: systemInfoReport,
            collectedAt: new Date()
          });
          console.log(`[DEBUG] Successfully stored system_info_heartbeat report for agent ${agentId}`);
        } catch (reportError) {
          console.error(`[ERROR] Failed to store system_info_heartbeat report for agent ${agentId}:`, reportError);
        }
      } else {
        console.log(`[DEBUG] No system info found in heartbeat from agent ${agentId}`);
      }

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

      console.log(`[DEBUG] Received report from agent ${agentId}`);

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

      // Use same fallback logic as latest-report endpoint
      let latestReportData = null;
      
      // First try full system report
      const fullReport = await storage.getLatestReport(agentId, "full_system_report");
      
      if (fullReport && fullReport.reportData && Object.keys(fullReport.reportData).length > 0) {
        latestReportData = fullReport.reportData;
      } else {
        // Fall back to heartbeat-based system info
        const heartbeatReport = await storage.getLatestReport(agentId, "system_info_heartbeat");
        if (heartbeatReport && heartbeatReport.reportData) {
          latestReportData = heartbeatReport.reportData;
        }
      }

      const heartbeat = await storage.getLatestHeartbeat(agentId);

      res.json({
        ...agent,
        latestReport: latestReportData,
        heartbeat
      });
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  // Get commands for a specific agent
  app.get('/api/agents/:agentId/commands', (req, res) => {
    const { agentId } = req.params;

    // For now, return empty commands array
    // In the future, this could return pending commands from a queue
    res.json({ commands: [] });
  });

  // Get latest report for a specific agent
  app.get('/api/agents/:agentId/latest-report', async (req, res) => {
    try {
      const { agentId } = req.params;
      console.log(`[DEBUG] Fetching latest report for agent ${agentId}`);

      // First try to get full system report
      const fullReport = await storage.getLatestReport(agentId, "full_system_report");
      console.log(`[DEBUG] Full system report found:`, !!fullReport);
      console.log(`[DEBUG] Full system report data:`, fullReport?.reportData ? Object.keys(fullReport.reportData).length : 'null/undefined');

      if (fullReport && fullReport.reportData && Object.keys(fullReport.reportData).length > 0) {
        console.log(`[DEBUG] Returning full system report for agent ${agentId}`);
        return res.json(fullReport.reportData);
      }

      // If no full report, try to get system info from heartbeat report
      const heartbeatReport = await storage.getLatestReport(agentId, "system_info_heartbeat");
      console.log(`[DEBUG] Heartbeat system report found:`, !!heartbeatReport);
      
      if (heartbeatReport && heartbeatReport.reportData) {
        console.log(`[DEBUG] Returning heartbeat system report for agent ${agentId}`);
        return res.json(heartbeatReport.reportData);
      }

      // If no reports at all, return empty response
      console.log(`[DEBUG] No reports found for agent ${agentId}`);
      return res.status(404).json({ error: 'No system information available for this agent' });
    } catch (error) {
      console.error('Error fetching latest report:', error);
      res.status(500).json({ error: 'Failed to fetch latest report' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}