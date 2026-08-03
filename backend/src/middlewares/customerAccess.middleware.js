import Order from "../models/order.js";
import {
  getRequestQRToken,
  getRequestTableId,
  verifyTableAccessToken,
} from "./qrAccess.middleware.js";

export const requireTableAccess = async (req, res, next) => {
  try {
    const tableId = getRequestTableId(req);
    const token = getRequestQRToken(req);
    const result = await verifyTableAccessToken(tableId, token);

    if (!result.ok) {
      return res.status(result.status).json({
        success: false,
        error: result.message,
      });
    }

    req.table = result.table;
    req.tableId = result.table.id;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Không thể xác minh quyền truy cập bàn",
    });
  }
};

export const requireOrderAccess = (getOrderId = (req) => req.params.orderId) => {
  return async (req, res, next) => {
    try {
      const orderId = getOrderId(req);

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: "Thiếu mã đơn hàng",
        });
      }

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Không tìm thấy đơn hàng",
        });
      }

      const customerId = req.user?.id || req.customer?.uid;
      if (customerId && String(order.customer_id) === String(customerId)) {
        req.accessibleOrder = order;
        return next();
      }

      const token = getRequestQRToken(req);
      const result = await verifyTableAccessToken(order.table_id, token);

      if (!result.ok) {
        return res.status(result.status).json({
          success: false,
          error: result.message,
        });
      }

      req.table = result.table;
      req.tableId = result.table.id;
      req.accessibleOrder = order;
      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Không thể xác minh quyền truy cập đơn hàng",
      });
    }
  };
};
