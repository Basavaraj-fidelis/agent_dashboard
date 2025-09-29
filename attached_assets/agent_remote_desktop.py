
import asyncio
import websockets
import json
import base64
import io
import time
from PIL import ImageGrab, Image
import pyautogui
import threading
from typing import Optional, Dict, Any

class RemoteDesktopAgent:
    def __init__(self, agent_id: str, server_url: str = "ws://localhost:5000"):
        self.agent_id = agent_id
        self.server_url = server_url
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None
        self.active_sessions: Dict[str, Dict] = {}
        self.running = False
        
        # Configure pyautogui
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.01
        
    async def connect(self):
        """Connect to the WebSocket server"""
        try:
            uri = f"{self.server_url}?agentId={self.agent_id}&type=agent"
            self.websocket = await websockets.connect(uri)
            self.running = True
            
            # Register as agent
            await self.send_message({
                "type": "agent_register",
                "agentId": self.agent_id
            })
            
            print(f"[RemoteDesktopAgent] Connected to server: {self.server_url}")
            
            # Start message handler
            await self.handle_messages()
            
        except Exception as e:
            print(f"[RemoteDesktopAgent] Connection error: {e}")
            self.running = False
    
    async def send_message(self, message: Dict[str, Any]):
        """Send message to server"""
        if self.websocket:
            await self.websocket.send(json.dumps(message))
    
    async def handle_messages(self):
        """Handle incoming WebSocket messages"""
        try:
            async for message in self.websocket:
                data = json.loads(message)
                await self.process_message(data)
        except Exception as e:
            print(f"[RemoteDesktopAgent] Message handling error: {e}")
        finally:
            self.running = False
    
    async def process_message(self, message: Dict[str, Any]):
        """Process incoming messages"""
        msg_type = message.get("type")
        
        if msg_type == "remote_session_start":
            await self.start_session(message["sessionId"])
        elif msg_type == "remote_session_end":
            await self.end_session(message["sessionId"])
        elif msg_type == "capture_screen":
            await self.capture_screen(message["sessionId"])
        elif msg_type == "mouse_event":
            await self.handle_mouse_event(message)
        elif msg_type == "keyboard_event":
            await self.handle_keyboard_event(message)
        elif msg_type == "ping":
            await self.send_message({"type": "pong"})
    
    async def start_session(self, session_id: str):
        """Start a remote desktop session"""
        self.active_sessions[session_id] = {
            "start_time": time.time(),
            "active": True
        }
        print(f"[RemoteDesktopAgent] Started session: {session_id}")
    
    async def end_session(self, session_id: str):
        """End a remote desktop session"""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        print(f"[RemoteDesktopAgent] Ended session: {session_id}")
    
    async def capture_screen(self, session_id: str):
        """Capture screen and send to dashboard"""
        if session_id not in self.active_sessions:
            return
        
        try:
            # Capture screen
            screenshot = ImageGrab.grab()
            
            # Resize for better performance (max 1280x720)
            width, height = screenshot.size
            if width > 1280:
                new_height = int((1280 / width) * height)
                screenshot = screenshot.resize((1280, new_height), Image.Resampling.LANCZOS)
            
            # Convert to JPEG and encode to base64
            buffer = io.BytesIO()
            screenshot.save(buffer, format='JPEG', quality=75, optimize=True)
            image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            # Send screen data
            await self.send_message({
                "type": "screen_data",
                "sessionId": session_id,
                "data": image_data
            })
            
        except Exception as e:
            print(f"[RemoteDesktopAgent] Screen capture error: {e}")
    
    async def handle_mouse_event(self, message: Dict[str, Any]):
        """Handle mouse events"""
        session_id = message.get("sessionId")
        if session_id not in self.active_sessions:
            return
        
        try:
            event_data = message["data"]
            event_type = event_data["type"]
            x, y = event_data["x"], event_data["y"]
            
            if event_type == "click":
                button = event_data.get("button", 0)
                if button == 0:  # Left click
                    pyautogui.click(x, y)
                elif button == 2:  # Right click
                    pyautogui.rightClick(x, y)
            elif event_type == "mousedown":
                pyautogui.mouseDown(x, y, button='left' if event_data.get("button", 0) == 0 else 'right')
            elif event_type == "mouseup":
                pyautogui.mouseUp(x, y, button='left' if event_data.get("button", 0) == 0 else 'right')
            elif event_type == "mousemove":
                pyautogui.moveTo(x, y)
                
        except Exception as e:
            print(f"[RemoteDesktopAgent] Mouse event error: {e}")
    
    async def handle_keyboard_event(self, message: Dict[str, Any]):
        """Handle keyboard events"""
        session_id = message.get("sessionId")
        if session_id not in self.active_sessions:
            return
        
        try:
            event_data = message["data"]
            event_type = event_data["type"]
            
            if event_type == "keydown":
                key = event_data["key"]
                
                # Handle special keys
                special_keys = {
                    "Enter": "enter",
                    "Escape": "escape",
                    "Backspace": "backspace",
                    "Tab": "tab",
                    "Space": "space",
                    "ArrowUp": "up",
                    "ArrowDown": "down",
                    "ArrowLeft": "left",
                    "ArrowRight": "right",
                    "Delete": "delete",
                    "Home": "home",
                    "End": "end",
                    "PageUp": "pageup",
                    "PageDown": "pagedown"
                }
                
                if key in special_keys:
                    pyautogui.press(special_keys[key])
                elif len(key) == 1:
                    # Handle modifier keys
                    modifiers = []
                    if event_data.get("ctrlKey"):
                        modifiers.append("ctrl")
                    if event_data.get("altKey"):
                        modifiers.append("alt")
                    if event_data.get("shiftKey"):
                        modifiers.append("shift")
                    
                    if modifiers:
                        pyautogui.hotkey(*modifiers, key.lower())
                    else:
                        pyautogui.press(key.lower())
                        
        except Exception as e:
            print(f"[RemoteDesktopAgent] Keyboard event error: {e}")
    
    async def disconnect(self):
        """Disconnect from server"""
        self.running = False
        if self.websocket:
            await self.websocket.close()

# Integration with existing agent
async def start_remote_desktop_service(agent_id: str, server_url: str = "ws://localhost:5000"):
    """Start the remote desktop service"""
    agent = RemoteDesktopAgent(agent_id, server_url)
    
    while True:
        try:
            await agent.connect()
        except Exception as e:
            print(f"[RemoteDesktopAgent] Connection failed: {e}")
            await asyncio.sleep(5)  # Wait before reconnecting

if __name__ == "__main__":
    # Example usage
    import sys
    
    agent_id = sys.argv[1] if len(sys.argv) > 1 else "AGENT001"
    server_url = sys.argv[2] if len(sys.argv) > 2 else "ws://localhost:5000"
    
    print(f"Starting Remote Desktop Agent: {agent_id}")
    asyncio.run(start_remote_desktop_service(agent_id, server_url))
