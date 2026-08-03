// src/routes/restaurant/index.js
import express from "express";
import { authorizeRoles } from "../../middlewares/authorizeRoles.middleware.js";
import tableAdminRoutes from "./tableAdmin.routes.js";
import menuRoutes from "./menu/index.js";
import menuItemPhotoRoutes from "./menuItemPhoto.routes.js";
import orderRoutes from './order.routes.js';
import kitchenRoutes from "./kitchen.routes.js";
import reportRoutes from "./report.routes.js";

const router = express.Router();

const managerRoles = ["admin", "super_admin"];
const kitchenRoles = ["kitchen", "admin", "super_admin"];
const waiterRoles = ["waiter", "admin", "super_admin"];

router.use("/tables", authorizeRoles(...managerRoles), tableAdminRoutes);
router.use("/menu", authorizeRoles(...managerRoles), menuRoutes);
router.use("/menu", authorizeRoles(...managerRoles), menuItemPhotoRoutes);
router.use("/kitchen", authorizeRoles(...kitchenRoles), kitchenRoutes);
router.use("/orders", authorizeRoles(...waiterRoles), orderRoutes);
router.use("/reports", authorizeRoles(...managerRoles), reportRoutes);

export default router;
