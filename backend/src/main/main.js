// src/main.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http'; // [NEW] Import HTTP module
import { Server } from 'socket.io';  // [NEW] Import Socket.IO

import db from '../models/index.js'; 
import rootRouter from '../routes/index.js';
import tablePublicRoutes from "../routes/restaurant/tablePublic.routes.js"
import env from '../config/env.js';
import logger from '../config/logger.js';
import { errorHandler, notFoundHandler } from '../middlewares/errorHandler.middleware.js';

const app = express();
//app.use('/uploads', express.static('uploads'));
const PORT = env.port;
const allowedOrigins = [
  env.cors.frontendUrl,
  "http://localhost:3001",
].filter(Boolean);

// [NEW] Setup HTTP Server & Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
if (!env.isProduction) {
  app.use(morgan("dev"));
}
app.use(express.json());

// [NEW] Middleware chèn biến 'io' vào mọi request
// Giúp bạn gọi req.io.emit() ở bất kỳ controller nào
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO Connection Events (Optional: Để debug)
io.on('connection', (socket) => {
  logger.info('Socket connected:', socket.id);
  
  socket.on('disconnect', () => {
    logger.info('Socket disconnected:', socket.id);
  });
});

// Routes
app.use('/api/public', tablePublicRoutes);
app.use('/api', rootRouter);

// Test routes
app.get("/connected", (req, res) => {
  res.json({
    status: "OK",
    database: "Connected successfully",
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await db.sequelize.authenticate();
    logger.info('Database connected successfully');
    
    if (env.database.syncAlter) {
      await db.sequelize.sync({ alter: true });
      logger.warn('Database schema synced with alter=true');
    }
    
    // [CHANGED] Dùng httpServer.listen thay vì app.listen
    httpServer.listen(PORT, () => {
      logger.info(`Server running at http://localhost:${PORT}`);
    });
    
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
