import logger from "../../config/logger.js";
import OrderHistoryService from "../../services/orderHistory.service.js";
import OrderItemService from "../../services/orderItem.service.js";

const emitOrderItemsChanged = (req, order) => {
  if (!req.io || !order) return;

  req.io.emit("new_order_created", order);
  req.io.emit("order_status_updated", order);

  if (order.table) {
    req.io.emit(`order_update_table_${order.table.id}`, order);
  }
};

export const createOrderItems = async (req, res) => {
  try {
    const { order_id: orderId, items } = req.body;

    await OrderItemService.createOrderItems({
      order_id: orderId,
      items,
    });

    const fullOrder = await OrderHistoryService.getOrderById(null, orderId);
    emitOrderItemsChanged(req, fullOrder);

    return res.status(201).json({
      success: true,
      message: `Da them ${items.length} mon thanh cong`,
      data: fullOrder,
    });
  } catch (error) {
    logger.error("[OrderItem Controller] createOrderItems error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Loi server khi them mon an",
    });
  }
};

export const getOrderItemsByOrderId = async (req, res) => {
  try {
    const formattedItems = await OrderItemService.getItemsByOrderId(
      req.params.orderId,
    );

    return res.json({
      success: true,
      data: formattedItems,
    });
  } catch (error) {
    logger.error("[OrderItem Controller] getOrderItemsByOrderId error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Loi server khi lay chi tiet mon an",
    });
  }
};
