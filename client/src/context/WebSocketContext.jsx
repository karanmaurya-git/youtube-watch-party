import React, { createContext, useContext, useState, useEffect } from 'react';
import { wsClient } from '../services/websocket';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const { isAuthenticated, fetchWsTicket } = useAuth();

  useEffect(() => {
    const unsubStatus = wsClient.on('status_change', (status) => {
      setConnectionStatus(status);
    });

    return () => {
      unsubStatus();
    };
  }, []);

  const connectWebSocket = async () => {
    if (!isAuthenticated) return;
    try {
      const ticket = await fetchWsTicket();
      wsClient.connect(ticket);
    } catch (error) {
      console.error('Failed to obtain WS ticket for connection:', error);
      setConnectionStatus('disconnected');
    }
  };

  const disconnectWebSocket = () => {
    wsClient.disconnect();
  };

  return (
    <WebSocketContext.Provider
      value={{
        ws: wsClient,
        connectionStatus,
        isConnected: connectionStatus === 'connected',
        connectWebSocket,
        disconnectWebSocket,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
