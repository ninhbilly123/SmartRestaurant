import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import env from "../config/env.js";
import rootRouter from "../routes/index.js";
import tablePublicRoutes from "../routes/restaurant/tablePublic.routes.js";
import { errorHandler, notFoundHandler } from "../middlewares/errorHandler.middleware.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.cors.allowedOrigins,
      credentials: true,
    })
  );

  if (!env.isProduction) {
    app.use(morgan("dev"));
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    req.io = req.app.get("io");
    next();
  });

  app.use("/api/public", tablePublicRoutes);
  app.use("/api", rootRouter);

  app.get("/connected", (req, res) => {
    res.json({
      status: "OK",
      database: "Connected successfully",
      timestamp: new Date().toISOString(),
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
