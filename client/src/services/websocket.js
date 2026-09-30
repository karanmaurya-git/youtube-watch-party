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
  }

  connect(ticket) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ticket = ticket;
    this.isManuallyClosed = false;
    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    this.url = `${baseUrl}?ticket=${encodeURIComponent(ticket)}`;

    this.emitStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('⚡ Native WebSocket connected');
        this.reconnectAttempts = 0;
        this.emitStatus('connected');
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
      };
    } catch (error) {
      console.error('❌ WebSocket instantiation failed:', error);
      this.emitStatus('disconnected');
    }
  }

  disconnect() {
    this.isManuallyClosed = true;
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
      console.warn('⚠️ Cannot send message: WebSocket is not open', messageObj);
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
