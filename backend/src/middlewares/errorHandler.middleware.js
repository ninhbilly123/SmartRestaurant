import env from "../config/env.js";
import logger from "../config/logger.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Không tìm thấy tài nguyên",
  });
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || 500;
  const payload = {
    success: false,
    message: err.message || "Lỗi máy chủ",
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (!env.isProduction) {
    payload.stack = err.stack;
  }

  if (statusCode >= 500) {
    logger.error(err);
  }

  return res.status(statusCode).json(payload);
};
