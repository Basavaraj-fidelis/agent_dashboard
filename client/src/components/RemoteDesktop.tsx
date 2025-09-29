
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Square, Maximize2, Minimize2, MousePointer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RemoteDesktopProps {
  agentId: string;
  hostname: string;
  onClose: () => void;
}

interface RemoteSession {
  sessionId: string;
  connected: boolean;
  startTime: Date;
}

export default function RemoteDesktop({ agentId, hostname, onClose }: RemoteDesktopProps) {
  const [session, setSession] = useState<RemoteSession | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenData, setScreenData] = useState<string | null>(null);
  const [mouseEnabled, setMouseEnabled] = useState(true);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  const [fps, setFps] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}?type=dashboard`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('[RemoteDesktop] WebSocket connected');
      setConnectionStatus('connecting');
      
      // Register as dashboard
      wsRef.current?.send(JSON.stringify({
        type: 'dashboard_register'
      }));
      
      // Start remote session
      wsRef.current?.send(JSON.stringify({
        type: 'start_remote_session',
        agentId
      }));
    };
    
    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('[RemoteDesktop] WebSocket error:', error);
      setConnectionStatus('error');
    };
    
    wsRef.current.onclose = () => {
      console.log('[RemoteDesktop] WebSocket disconnected');
      setConnectionStatus('disconnected');
      setSession(null);
    };
  }, [agentId]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'session_started':
        setSession({
          sessionId: message.sessionId,
          connected: true,
          startTime: new Date()
        });
        setConnectionStatus('connected');
        startScreenCapture(message.sessionId);
        break;
        
      case 'session_error':
        setConnectionStatus('error');
        console.error('[RemoteDesktop] Session error:', message.error);
        break;
        
      case 'screen_data':
        handleScreenData(message.data);
        break;
        
      case 'session_ended':
        setSession(null);
        setConnectionStatus('disconnected');
        break;
    }
  }, []);

  // Start screen capture
  const startScreenCapture = useCallback((sessionId: string) => {
    const captureLoop = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN && session?.connected) {
        wsRef.current.send(JSON.stringify({
          type: 'screen_capture_request',
          agentId,
          sessionId
        }));
        
        // Request next frame (aim for ~10 FPS)
        setTimeout(captureLoop, 100);
      }
    };
    
    captureLoop();
  }, [agentId, session]);

  // Handle screen data
  const handleScreenData = useCallback((imageData: string) => {
    setScreenData(imageData);
    
    // Update FPS counter
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsUpdateRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }
    
    // Draw on canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
      
      img.src = `data:image/jpeg;base64,${imageData}`;
    }
  }, []);

  // Mouse event handlers
  const handleMouseEvent = useCallback((event: React.MouseEvent) => {
    if (!mouseEnabled || !session || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    wsRef.current?.send(JSON.stringify({
      type: 'mouse_event',
      agentId,
      sessionId: session.sessionId,
      data: {
        type: event.type,
        x: Math.round(x),
        y: Math.round(y),
        button: event.button
      }
    }));
  }, [mouseEnabled, session, agentId]);

  // Keyboard event handlers
  const handleKeyEvent = useCallback((event: React.KeyboardEvent) => {
    if (!keyboardEnabled || !session) return;
    
    event.preventDefault();
    
    wsRef.current?.send(JSON.stringify({
      type: 'keyboard_event',
      agentId,
      sessionId: session.sessionId,
      data: {
        type: event.type,
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey
      }
    }));
  }, [keyboardEnabled, session, agentId]);

  // Connect/Disconnect
  const handleConnect = () => {
    if (connectionStatus === 'disconnected') {
      connectWebSocket();
    }
  };

  const handleDisconnect = () => {
    if (session) {
      wsRef.current?.send(JSON.stringify({
        type: 'end_remote_session',
        sessionId: session.sessionId
      }));
    }
    
    wsRef.current?.close();
    setSession(null);
    setConnectionStatus('disconnected');
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (session) {
        wsRef.current?.send(JSON.stringify({
          type: 'end_remote_session',
          sessionId: session.sessionId
        }));
      }
      wsRef.current?.close();
    };
  }, [session]);

  return (
    <div ref={containerRef} className={cn("space-y-4", isFullscreen && "fixed inset-0 z-50 bg-black")}>
      {/* Control Panel */}
      <Card className={cn(isFullscreen && "absolute top-4 left-4 z-10 w-auto")}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Remote Desktop - {hostname}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={
                connectionStatus === 'connected' ? 'default' :
                connectionStatus === 'connecting' ? 'secondary' :
                connectionStatus === 'error' ? 'destructive' : 'outline'
              }>
                {connectionStatus}
              </Badge>
              {session && <Badge variant="outline">{fps} FPS</Badge>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            {connectionStatus === 'disconnected' ? (
              <Button onClick={handleConnect} size="sm">
                <Monitor className="w-4 h-4 mr-2" />
                Connect
              </Button>
            ) : (
              <Button onClick={handleDisconnect} variant="destructive" size="sm">
                <Square className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            )}
            
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              disabled={!session}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={() => setMouseEnabled(!mouseEnabled)}
              variant={mouseEnabled ? "default" : "outline"}
              size="sm"
              disabled={!session}
            >
              <MousePointer className="w-4 h-4" />
            </Button>
            
            {!isFullscreen && (
              <Button onClick={onClose} variant="outline" size="sm">
                Close
              </Button>
            )}
          </div>
          
          {session && (
            <div className="text-xs text-muted-foreground">
              Session: {session.sessionId.split('_')[2]} • Started: {session.startTime.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screen Display */}
      <Card className={cn("overflow-hidden", isFullscreen && "flex-1 border-0 rounded-none")}>
        <CardContent className="p-0">
          {connectionStatus === 'connected' && session ? (
            <canvas
              ref={canvasRef}
              className="w-full h-auto cursor-crosshair"
              onClick={handleMouseEvent}
              onMouseDown={handleMouseEvent}
              onMouseUp={handleMouseEvent}
              onMouseMove={handleMouseEvent}
              onKeyDown={handleKeyEvent}
              onKeyUp={handleKeyEvent}
              tabIndex={0}
              style={{ maxHeight: isFullscreen ? 'calc(100vh - 120px)' : '600px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-96 bg-muted">
              <div className="text-center">
                <Monitor className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">
                  {connectionStatus === 'connecting' ? 'Connecting...' :
                   connectionStatus === 'error' ? 'Connection Error' :
                   'Not Connected'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus === 'connecting' ? 'Establishing remote session...' :
                   connectionStatus === 'error' ? 'Failed to connect to agent' :
                   'Click Connect to start remote session'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
