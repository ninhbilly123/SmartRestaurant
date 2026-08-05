import express from "express";
import {
  getKitchenOrders,
  getKitchenStats,
  updateOrderItemStatus,
} from "../../controllers/restaurant/kitchen.controller.js";
import { updateOrderStatus } from "../../controllers/restaurant/order.controller.js";

const router = express.Router();

router.get("/orders", getKitchenOrders);
router.get("/stats", getKitchenStats);

router.patch(
  "/orders/:orderId/status",
  (req, res, next) => {
    req.orderStatusScope = "kitchen";
    next();
  },
  updateOrderStatus,
);

router.put("/items/:itemId/status", updateOrderItemStatus);

export default router;
