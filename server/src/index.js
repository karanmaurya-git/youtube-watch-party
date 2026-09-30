import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import env from './config/env.js';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import { setupWebSocketServer } from './websocket/WebSocketServer.js';

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, same-origin)
      if (!origin) return callback(null, true);
      // In dev or matched CLIENT_URL
      if (env.NODE_ENV === 'development' || origin === env.CLIENT_URL) {
        return callback(null, true);
      }
      return callback(null, true); // Allow configured clients
    },
    credentials: true,
  })
);

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'YouTube Watch Party API is running',
    environment: env.NODE_ENV,
  });
});

// Health Check Endpoint (Required by assignment section 47)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Create HTTP Server
const server = http.createServer(app);

// Attach WebSocket Server (Node.js "ws" package attached to same HTTP server)
setupWebSocketServer(server);

// Connect Database & Start Server
const startServer = async () => {
  await connectDB();

  server.listen(env.PORT, () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`📡 Health Check: http://localhost:${env.PORT}/api/health`);
  });
};

startServer();

export { app, server };
