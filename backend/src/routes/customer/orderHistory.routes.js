import express from "express";
import {
    getMyOrders,
    getOrderById,
    createOrder
} from "../../controllers/customer/orderHistory.controller.js"
import {
  optionalCustomerAuth,
  requireCustomerAuth,
} from "../../middlewares/authCustomer.middleware.js";
import { requireTableAccess } from "../../middlewares/customerAccess.middleware.js";

const router = express.Router()

// POST /api/customer/orders - Tạo order mới
router.post("/", optionalCustomerAuth, requireTableAccess, createOrder);

// GET /api/customer/orders - Lấy danh sách orders
router.get("/", requireCustomerAuth, getMyOrders);

// GET /api/customer/orders/:id
router.get("/:id", requireCustomerAuth, getOrderById);

export default router;
