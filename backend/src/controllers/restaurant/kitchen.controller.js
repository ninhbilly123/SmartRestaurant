import logger from "../../config/logger.js";
import kitchenService from "../../services/kitchen.service.js";

const handleError = (res, error, fallback = "Server error") => {
  return res.status(error.status || 500).json({
    success: false,
    message: error.message || fallback,
  });
};

export const getKitchenOrders = async (req, res) => {
  try {
    const orders = await kitchenService.getKitchenOrders({
      status: req.query.status,
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    logger.error("[Kitchen Controller] getKitchenOrders error:", error);
    return handleError(res, error, "Khong the lay danh sach don hang");
  }
};

export const getKitchenStats = async (req, res) => {
  try {
    const stats = await kitchenService.getKitchenStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("[Kitchen Controller] getKitchenStats error:", error);
    return handleError(res, error, "Khong the lay thong ke bep");
  }
};

export const updateOrderItemStatus = async (req, res) => {
  try {
    const fullOrder = await kitchenService.updateOrderItemStatus({
      itemId: req.params.itemId,
      status: req.body.status,
      io: req.io,
    });

    return res.json({ success: true, data: fullOrder });
  } catch (error) {
    logger.error("[Kitchen Controller] updateOrderItemStatus error:", error);
    return handleError(res, error);
  }
};
