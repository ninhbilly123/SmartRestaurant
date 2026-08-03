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

  const statusCode = err.statusCode || err.status || 500;
  const message =
    env.isProduction && statusCode >= 500
      ? "Lỗi máy chủ"
      : err.message || "Lỗi máy chủ";

  const payload = {
    success: false,
    message,
  };

  if (err.details && (!env.isProduction || statusCode < 500)) {
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
