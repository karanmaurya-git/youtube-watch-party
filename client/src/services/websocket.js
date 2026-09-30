// Native Browser WebSocket API Wrapper (No Socket.IO)

export class WebSocketClient {
  constructor() {
    this.ws = null;
    this.url = null;
    this.listeners = new Map(); // eventType -> Set of callback functions
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.isManuallyClosed = false;
    this.ticket = null;
    this.messageQueue = [];
    this.connectionPromise = null;
  }

  connect(ticket) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.ticket = ticket;
    this.isManuallyClosed = false;
    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    this.url = `${baseUrl}?ticket=${encodeURIComponent(ticket)}`;

    this.emitStatus('connecting');

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('⚡ Native WebSocket connected');
          this.reconnectAttempts = 0;
          this.emitStatus('connected');
          this.connectionPromise = null;

          // Flush queued messages
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            this.ws.send(JSON.stringify(msg));
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleIncomingMessage(data);
          } catch (err) {
            console.error('❌ Failed to parse incoming WebSocket message:', err);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 Native WebSocket closed', event.code, event.reason);
          this.emitStatus('disconnected');
          this.connectionPromise = null;

          if (!this.isManuallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
            console.log(`🔄 Reconnecting in ${Math.round(delay / 1000)}s (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            this.emitStatus('reconnecting');
            setTimeout(() => {
              if (this.ticket) this.connect(this.ticket);
            }, delay);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Native WebSocket error:', error);
          this.connectionPromise = null;
          reject(error);
        };
      } catch (error) {
        console.error('❌ WebSocket instantiation failed:', error);
        this.emitStatus('disconnected');
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  disconnect() {
    this.isManuallyClosed = true;
    this.messageQueue = [];
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.emitStatus('disconnected');
  }

  send(messageObj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(messageObj));
    } else {
      console.log('⏳ Queuing message until WebSocket connects:', messageObj);
      this.messageQueue.push(messageObj);
    }
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Return unsubscriber function
    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
      }
    };
  }

  handleIncomingMessage(message) {
    const { type } = message;

    // Trigger specific type listeners
    if (type && this.listeners.has(type)) {
      this.listeners.get(type).forEach((cb) => cb(message));
    }

    // Trigger wildcard '*' listeners
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach((cb) => cb(message));
    }
  }

  emitStatus(status) {
    if (this.listeners.has('status_change')) {
      this.listeners.get('status_change').forEach((cb) => cb(status));
    }
  }

  getStatus() {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'disconnected';
    }
  }
}

export const wsClient = new WebSocketClient();
