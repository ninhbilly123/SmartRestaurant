import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import verifyQRTokenMiddleware from "../middlewares/verifyQRToken.middleware.js";

import authRoutes from "./auth.routes.js";
import restaurantRoutes from "./restaurant/index.js";
import customerRoutes from "./customer/index.js";
import guestMenuRoutes from "./customer/guestMenu.routes.js";

const router = express.Router();

// 1. Auth & Admin
router.use("/auth", authRoutes);
router.use("/admin", verifyToken, restaurantRoutes);

// 2. Customer routes (tất cả routes customer được quản lý trong customer/index.js)
// Bao gồm: auth, tables, reviews, payment, orders, order-items
router.use("/customer", customerRoutes);

// 3. Guest Menu (path /menu riêng, không nằm trong /customer)
router.use("/menu", verifyQRTokenMiddleware, guestMenuRoutes);

export default router;
