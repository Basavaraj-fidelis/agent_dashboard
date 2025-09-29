
import { WebSocketServer, WebSocket } from 'ws';

interface WebSocketMessage {
  type: string;
  agentId?: string;
  data?: any;
  sessionId?: string;
}

interface ActiveSession {
  agentId: string;
  dashboardWs: WebSocket;
  agentWs: WebSocket;
  sessionId: string;
  startTime: Date;
}

const activeSessions = new Map<string, ActiveSession>();
const agentConnections = new Map<string, WebSocket>();
const dashboardConnections = new Map<string, WebSocket>();

export function handleWebSocketMessage(
  ws: WebSocket,
  message: WebSocketMessage,
  agentId: string | null,
  clientType: string | null,
  wss: WebSocketServer
) {
  console.log(`[WebSocket] ${clientType} message:`, message.type);

  switch (message.type) {
    case 'agent_register':
      if (agentId && clientType === 'agent') {
        agentConnections.set(agentId, ws);
        console.log(`[WebSocket] Agent ${agentId} registered`);
      }
      break;

    case 'dashboard_register':
      if (clientType === 'dashboard') {
        const connectionId = `dashboard_${Date.now()}`;
        dashboardConnections.set(connectionId, ws);
        console.log(`[WebSocket] Dashboard registered: ${connectionId}`);
      }
      break;

    case 'start_remote_session':
      handleStartRemoteSession(ws, message, wss);
      break;

    case 'end_remote_session':
      handleEndRemoteSession(message);
      break;

    case 'screen_capture_request':
      forwardToAgent(message.agentId!, {
        type: 'capture_screen',
        sessionId: message.sessionId
      });
      break;

    case 'screen_data':
      forwardToDashboard(message.sessionId!, message);
      break;

    case 'mouse_event':
    case 'keyboard_event':
      forwardToAgent(message.agentId!, message);
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      console.log(`[WebSocket] Unknown message type: ${message.type}`);
  }
}

function handleStartRemoteSession(ws: WebSocket, message: WebSocketMessage, wss: WebSocketServer) {
  const { agentId } = message;
  if (!agentId) return;

  const agentWs = agentConnections.get(agentId);
  if (!agentWs) {
    ws.send(JSON.stringify({
      type: 'session_error',
      error: 'Agent not connected'
    }));
    return;
  }

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session: ActiveSession = {
    agentId,
    dashboardWs: ws,
    agentWs,
    sessionId,
    startTime: new Date()
  };

  activeSessions.set(sessionId, session);

  // Notify dashboard
  ws.send(JSON.stringify({
    type: 'session_started',
    sessionId,
    agentId
  }));

  // Notify agent
  agentWs.send(JSON.stringify({
    type: 'remote_session_start',
    sessionId
  }));

  console.log(`[WebSocket] Remote session started: ${sessionId} for agent ${agentId}`);
}

function handleEndRemoteSession(message: WebSocketMessage) {
  const { sessionId } = message;
  if (!sessionId) return;

  const session = activeSessions.get(sessionId);
  if (!session) return;

  // Notify both parties
  session.dashboardWs.send(JSON.stringify({
    type: 'session_ended',
    sessionId
  }));

  session.agentWs.send(JSON.stringify({
    type: 'remote_session_end',
    sessionId
  }));

  activeSessions.delete(sessionId);
  console.log(`[WebSocket] Remote session ended: ${sessionId}`);
}

function forwardToAgent(agentId: string, message: any) {
  const agentWs = agentConnections.get(agentId);
  if (agentWs) {
    agentWs.send(JSON.stringify(message));
  }
}

function forwardToDashboard(sessionId: string, message: any) {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.dashboardWs.send(JSON.stringify(message));
  }
}

export function getActiveSessionsCount(): number {
  return activeSessions.size;
}

export function getConnectedAgentsCount(): number {
  return agentConnections.size;
}
