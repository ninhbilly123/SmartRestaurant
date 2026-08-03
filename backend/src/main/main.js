import { createServer } from "http";
import { Server } from "socket.io";

import db from "../models/index.js";
import env from "../config/env.js";
import logger from "../config/logger.js";
import { createApp } from "./app.js";

const app = createApp();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.cors.allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

let isShuttingDown = false;

const closeHttpServer = () =>
  new Promise((resolve, reject) => {
    if (!httpServer.listening) {
      resolve();
      return;
    }

    httpServer.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

const closeSocketServer = () =>
  new Promise((resolve) => {
    io.close(resolve);
  });

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received. Shutting down server...`);

  const forcedShutdownTimer = setTimeout(() => {
    logger.error("Forced shutdown because graceful shutdown timed out");
    process.exit(1);
  }, 10000);
  forcedShutdownTimer.unref();

  try {
    await closeSocketServer();
    await closeHttpServer();
    await db.sequelize.close();
    logger.info("Server shut down cleanly");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

async function startServer() {
  try {
    await db.sequelize.authenticate();
    logger.info("Database connected successfully");

    if (env.database.syncAlter) {
      await db.sequelize.sync({ alter: true });
      logger.warn("Database schema synced with alter=true");
    }

    httpServer.listen(env.port, () => {
      logger.info(`Server running at http://localhost:${env.port}`);
    });
  } catch (error) {
    logger.error("Unable to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("unhandledRejection", (error) => {
  logger.error("Unhandled promise rejection:", error);
  void shutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  void shutdown("uncaughtException");
});

startServer();
