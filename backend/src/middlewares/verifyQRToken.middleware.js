import logger from "../config/logger.js";
import {
  getRequestQRToken,
  getRequestTableId,
  verifyTableAccessToken,
} from "./qrAccess.middleware.js";

const verifyQRTokenMiddleware = async (req, res, next) => {
  try {
    const tableId = getRequestTableId(req);
    const token = getRequestQRToken(req);
    const result = await verifyTableAccessToken(tableId, token);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    req.table = result.table;
    req.tableId = result.table.id;
    return next();
  } catch (error) {
    logger.error("Error verifying QR token:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể xác minh mã QR",
    });
  }
};

export default verifyQRTokenMiddleware;
