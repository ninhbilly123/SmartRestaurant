import logger from "../../config/logger.js";
import restaurantOrderService from "../../services/restaurantOrder.service.js";

const handleError = (res, error, fallback = "Lỗi server") => {
  return res.status(error.status || 500).json({
    success: false,
    message: error.message || fallback,
  });
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await restaurantOrderService.getAllOrders();
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error("Get all orders error:", error);
    return handleError(res, error);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.params.id;
    const updatedOrder = await restaurantOrderService.updateOrderStatus({
      io: req.io,
      orderId,
      reason: req.body.reason,
      scope: req.orderStatusScope || "waiter",
      status: req.body.status,
    });

    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    logger.error("Update order status error:", error);
    return handleError(res, error);
  }
};

export const confirmBill = async (req, res) => {
  try {
    const order = await restaurantOrderService.confirmBill({
      discountType: req.body.discount_type,
      discountValue: req.body.discount_value,
      io: req.io,
      note: req.body.note,
      orderId: req.params.orderId,
      taxAmount: req.body.tax_amount,
    });

    return res.json({
      success: true,
      message: "Đã gửi hóa đơn cho khách",
      data: order,
    });
  } catch (error) {
    logger.error("Confirm bill error:", error);
    return handleError(res, error);
  }
};

export const markAsPaid = async (req, res) => {
  try {
    await restaurantOrderService.markAsPaid({
      io: req.io,
      orderId: req.params.orderId,
      paymentMethod: req.body.payment_method || "cash",
    });

    return res.json({
      success: true,
      message: "Thanh toán thành công",
    });
  } catch (error) {
    logger.error("Mark paid error:", error);
    return handleError(res, error);
  }
};

export const rejectOrderItem = async (req, res) => {
  try {
    const updatedOrder = await restaurantOrderService.rejectOrderItem({
      io: req.io,
      itemId: req.params.itemId,
      reason: req.body.reason,
    });

    return res.json({
      success: true,
      message: "Đã từ chối món",
      data: updatedOrder,
    });
  } catch (error) {
    logger.error("Reject order item error:", error);
    return handleError(res, error);
  }
};
