import Order from "../models/order.js";
import Table from "../models/table.js";
import QRService from "../services/qr.service.js";

const getRequestTableId = (req) =>
  req.headers["x-table-id"] ||
  req.query.table ||
  req.query.table_id ||
  req.body.table_id;

const getRequestQRToken = (req) =>
  req.headers["x-qr-token"] ||
  req.query.token ||
  req.body.qr_token ||
  req.body.token;

const verifyTableToken = async (tableId, token) => {
  if (!tableId || !token) {
    return {
      ok: false,
      status: 401,
      message: "Thiếu thông tin bàn hoặc QR token",
    };
  }

  let decoded;
  try {
    decoded = QRService.verifyToken(token);
  } catch (error) {
    return {
      ok: false,
      status: 401,
      message: "Mã QR không hợp lệ hoặc đã hết hạn",
    };
  }

  if (String(decoded.tableId) !== String(tableId)) {
    return {
      ok: false,
      status: 403,
      message: "QR token không khớp với bàn",
    };
  }

  const table = await Table.findByPk(tableId);
  if (!table) {
    return {
      ok: false,
      status: 404,
      message: "Không tìm thấy bàn",
    };
  }

  if (table.status !== "active") {
    return {
      ok: false,
      status: 403,
      message: "Bàn hiện không hoạt động",
    };
  }

  if (table.qr_token !== token) {
    return {
      ok: false,
      status: 401,
      message: "Mã QR cũ không còn hiệu lực",
    };
  }

  return { ok: true, table };
};

export const requireTableAccess = async (req, res, next) => {
  try {
    const tableId = getRequestTableId(req);
    const token = getRequestQRToken(req);
    const result = await verifyTableToken(tableId, token);

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
      const result = await verifyTableToken(order.table_id, token);

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
