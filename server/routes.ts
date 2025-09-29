import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { eq, desc } from "drizzle-orm";
import { agents, heartbeatCurrent, agentReports } from "../shared/schema";
import { db } from "./db";

// Helper function to determine agent status
function getAgentStatus(lastHeartbeat: Date): "online" | "warning" | "offline" {
  const lastHeartbeatTime = new Date(lastHeartbeat).getTime();
  const now = new Date().getTime();
  const timeDiffMinutes = (now - lastHeartbeatTime) / (1000 * 60);

  if (timeDiffMinutes <= 10) {
    return "online";
  } else if (timeDiffMinutes <= 30) {
    return "warning";
  } else {
    return "offline";
  }
}


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

      // Process USB device changes from heartbeat (if available)
      const usbDevices = heartbeatData.usbDevices || heartbeatData.USBDevices || [];
      
      try {
        // Always process USB changes, even if empty array (handles disconnections)
        await storage.processUsbDeviceChanges(agentId, usbDevices);
        console.log(`[DEBUG] Successfully processed USB device changes from heartbeat for agent ${agentId}, found ${usbDevices.length} devices`);
      } catch (usbError) {
        console.error(`[ERROR] Failed to process USB device changes from heartbeat for agent ${agentId}:`, usbError);
      }

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
            },
            USBDevices: usbDevices
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

      console.log(`[DEBUG] Received report from agent ${agentId}:`, JSON.stringify(reportData, null, 2));
      console.log(`[DEBUG] Report data keys:`, Object.keys(reportData || {}));

      // Validate that we have actual report data
      if (!reportData || typeof reportData !== 'object' || Object.keys(reportData).length === 0) {
        console.log(`[WARNING] Empty or invalid report data received from agent ${agentId}`);
        return res.status(400).json({ error: "Empty or invalid report data" });
      }

      await storage.insertReport({
        agentId,
        reportType: "full_system_report",
        reportData,
        collectedAt: new Date()
      });

      // Process USB device changes if USB data is present (check multiple possible paths)
      const usbDevices = 
        reportData?.system_info?.USBDevices ||
        reportData?.system_info?.USBStorageDevices ||
        reportData?.USBStorageDevices ||
        reportData?.USBDevices ||
        reportData?.usb_devices ||
        reportData?.usbDevices;

      if (usbDevices && Array.isArray(usbDevices) && usbDevices.length > 0) {
        try {
          await storage.processUsbDeviceChanges(agentId, usbDevices);
          console.log(`[DEBUG] Successfully processed USB device changes for agent ${agentId}, found ${usbDevices.length} devices`);
        } catch (usbError) {
          console.error(`[ERROR] Failed to process USB device changes for agent ${agentId}:`, usbError);
        }
      }

      console.log(`[DEBUG] Successfully stored full system report for agent ${agentId}`);
      res.json({ success: true, message: "Report received" });
    } catch (error) {
      console.error("Error processing report:", error);
      res.status(500).json({ error: "Failed to process report" });
    }
  });

  // Get all agents
  app.get("/api/agents", async (req, res) => {
    try {
      const agentsList = await storage.getAllAgents();

      // Calculate status based on last heartbeat
      const agentsWithStatus = agentsList.map(agent => {
        const status = getAgentStatus(agent.lastHeartbeat);
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

      // Get latest report for additional data
      const latestReport = await db
        .select()
        .from(agentReports)
        .where(eq(agentReports.agentId, agentId))
        .orderBy(desc(agentReports.collectedAt))
        .limit(1);

      let usbDevices: any[] = [];
      if (latestReport.length > 0) {
        const reportData = latestReport[0].reportData as any;
        // Try multiple possible paths for USB devices
        usbDevices =
          reportData?.system_info?.USBStorageDevices ||
          reportData?.USBStorageDevices ||
          reportData?.usb_devices ||
          reportData?.usbDevices ||
          [];
      }

      const heartbeat = await storage.getLatestHeartbeat(agentId);

      const deviceData = {
        agentId: agent.agentId,
        hostname: agent.hostname,
        os: agent.os,
        location: agent.location,
        username: agent.username,
        lastHeartbeat: agent.lastHeartbeat.toISOString(),
        status: getAgentStatus(agent.lastHeartbeat),
        networkInfo: heartbeat ? {
          local_ip: heartbeat.localIp
        } : undefined,
        usbDevices: Array.isArray(usbDevices) ? usbDevices : []
      };

      res.json({
        ...agent,
        latestReport: latestReport.length > 0 ? latestReport[0].reportData : null,
        heartbeat,
        usbDevices: Array.isArray(usbDevices) ? usbDevices : []
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

      if (fullReport?.reportData) {
        const reportDataKeys = Object.keys(fullReport.reportData);
        console.log(`[DEBUG] Full system report data keys:`, reportDataKeys);
        console.log(`[DEBUG] Full system report data structure:`, JSON.stringify(fullReport.reportData, null, 2));

        if (reportDataKeys.length > 0) {
          console.log(`[DEBUG] Returning full system report for agent ${agentId}`);
          return res.json(fullReport.reportData);
        }
      }

      // If no full report, try to get system info from heartbeat report
      const heartbeatReport = await storage.getLatestReport(agentId, "system_info_heartbeat");
      console.log(`[DEBUG] Heartbeat system report found:`, !!heartbeatReport);

      if (heartbeatReport?.reportData) {
        console.log(`[DEBUG] Heartbeat report data keys:`, Object.keys(heartbeatReport.reportData));
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

  // Get USB connection history for a specific agent
  app.get('/api/agents/:agentId/usb-history', async (req, res) => {
    try {
      const { agentId } = req.params;
      console.log(`[DEBUG] Fetching USB connection history for agent ${agentId}`);

      const usbHistory = await storage.getUsbConnectionHistory(agentId);
      
      // Format the response for better readability
      const formattedHistory = usbHistory.map(record => ({
        id: record.id,
        deviceId: record.deviceId,
        deviceModel: record.deviceModel,
        sizeGb: record.sizeGb,
        status: record.status,
        connectedAt: record.connectedAt.toISOString(),
        disconnectedAt: record.disconnectedAt ? record.disconnectedAt.toISOString() : null,
        duration: record.disconnectedAt 
          ? Math.round((record.disconnectedAt.getTime() - record.connectedAt.getTime()) / 1000 / 60) + ' minutes'
          : 'Still connected'
      }));

      res.json({
        agentId,
        history: formattedHistory,
        totalRecords: formattedHistory.length
      });
    } catch (error) {
      console.error('Error fetching USB history:', error);
      res.status(500).json({ error: 'Failed to fetch USB connection history' });
    }
  });

  // Debug endpoint to inspect database contents
  app.get('/api/debug/agents/:agentId/reports', async (req, res) => {
    try {
      const { agentId } = req.params;

      // Get all reports for this agent
      const fullReports = await storage.getLatestReport(agentId, "full_system_report");
      const heartbeatReports = await storage.getLatestReport(agentId, "system_info_heartbeat");

      res.json({
        agent_id: agentId,
        full_report: fullReports ? {
          collected_at: fullReports.collectedAt,
          data_type: typeof fullReports.reportData,
          data_keys: fullReports.reportData ? Object.keys(fullReports.reportData) : [],
          data: fullReports.reportData
        } : null,
        heartbeat_report: heartbeatReports ? {
          collected_at: heartbeatReports.collectedAt,
          data_type: typeof heartbeatReports.reportData,
          data_keys: heartbeatReports.reportData ? Object.keys(heartbeatReports.reportData) : [],
          data: heartbeatReports.reportData
        } : null
      });
    } catch (error) {
      console.error('Debug endpoint error:', error);
      res.status(500).json({ error: 'Debug query failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}