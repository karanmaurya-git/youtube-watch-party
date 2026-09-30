import { WebSocketServer } from 'ws';
import { consumeWsTicket } from '../utils/wsTickets.js';
import { WebSocketMessageHandler } from './WebSocketMessageHandler.js';

export const setupWebSocketServer = (httpServer) => {
  const wss = new WebSocketServer({ noServer: true });

  // Handle HTTP Upgrade request for WebSocket connection
  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const ticket = url.searchParams.get('ticket');

    // Authenticate via short-lived WebSocket ticket
    const clientInfo = consumeWsTicket(ticket);

    if (!clientInfo) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, clientInfo);
    });
  });

  wss.on('connection', (ws, request, clientInfo) => {
    ws.isAlive = true;
    ws.clientInfo = clientInfo;

    console.log(`🔌 WebSocket connected: user ${clientInfo.username} (${clientInfo.userId})`);

    // Heartbeat / ping-pong
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle incoming messages from client
    ws.on('message', async (messageRaw) => {
      await WebSocketMessageHandler.handleMessage(ws, messageRaw, clientInfo);
    });

    // Handle disconnect
    ws.on('close', () => {
      console.log(`🔌 WebSocket disconnected: user ${clientInfo.username} (${clientInfo.userId})`);
      WebSocketMessageHandler.handleLeaveRoom(ws, clientInfo);
    });

    // Handle socket errors
    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for ${clientInfo.username}:`, error.message);
    });
  });

  // Ping interval to detect stale / broken connections (every 30 seconds)
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  console.log('⚡ WebSocket server attached to HTTP server (using Node.js "ws" package)');
  return wss;
};
