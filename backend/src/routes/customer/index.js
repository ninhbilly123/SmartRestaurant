// src/routes/customer/index.js
import express from "express";
import customerAuthRoutes from "./customerAuth.routes.js";
import orderHistoryRoutes from "./orderHistory.routes.js";
import orderItemRoutes from "./orderItem.routes.js";
import paymentRoutes from "./payment.routes.js";
import tableRoutes from "./table.routes.js";
import reviewRoutes from "./review.routes.js";

const router = express.Router();

// 1. Customer Auth & Info (routes trực tiếp tại /customer/*)
// VD: /customer/register, /customer/login, /customer/me, ...
router.use("/", customerAuthRoutes);

// 2. Table routes
// VD: /customer/tables/:tableId/active-order
router.use("/tables", tableRoutes);

// 3. Reviews
// VD: /customer/reviews, /customer/reviews/menu-item/:menuItemId, ...
router.use("/reviews", reviewRoutes);

// 4. Payment (PHẢI ĐẶT TRƯỚC orderHistoryRoutes để tránh conflict path)
// VD: /customer/orders/:orderId/request-payment, /customer/payment/vnpay-callback, ...
router.use("/", paymentRoutes);

// 5. Orders: Khớp với API GET /api/customer/orders
// VD: /customer/orders, /customer/orders/:id
router.use("/orders", orderHistoryRoutes);

// 6. Order Items: Khớp với API POST /api/customer/order-items
// VD: /customer/order-items, /customer/order-items/order/:orderId
router.use("/order-items", orderItemRoutes);

export default router;
