import logger from "../../config/logger.js";
import OrderService from "../../services/orderHistory.service.js";
import { createOrderSchema } from "../../validators/order.validation.js";

const getCustomerId = (req) => req.user?.id || req.user?.uid || null;

const emitOrderCreated = (req, order, tableId) => {
  if (!req.io) return;

  req.io.emit("new_order_created", order);
  req.io.emit("order_status_updated", order);
  req.io.emit(`order_update_table_${tableId}`, order);
  logger.info(`Socket sent: New Order for Table ${tableId}`);
};

const handleError = (res, error, fallback = "Loi he thong") => {
  if (error.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      error: "Du lieu khong hop le",
      message: "Ma ban khong ton tai. Vui long quet lai ma QR.",
    });
  }

  return res.status(error.status || 500).json({
    success: false,
    error: fallback,
    message: error.message,
  });
};

export const createOrder = async (req, res) => {
  try {
    const customerID = getCustomerId(req);
    const { error, value } = createOrderSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const order = await OrderService.createOrder({
      customer_id: customerID,
      table_id: value.table_id,
      items: value.items,
      note: value.note || "",
    });

    emitOrderCreated(req, order, value.table_id);

    return res.status(201).json({
      success: true,
      message: customerID
        ? "Dat mon thanh vien thanh cong"
        : "Khach vang lai dat mon thanh cong",
      data: order,
    });
  } catch (error) {
    logger.error("[Order Controller] createOrder error:", error);
    return handleError(res, error);
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const customerID = req.user?.uid || req.user?.id;

    if (!customerID) {
      return res.status(401).json({
        success: false,
        error: "Vui long dang nhap de xem lich su don hang",
      });
    }

    const orders = await OrderService.getCustomerOrder(customerID, req.query);

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ success: false, error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await OrderService.getOrderById(null, req.params.id);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ success: false, error: error.message });
  }
};
