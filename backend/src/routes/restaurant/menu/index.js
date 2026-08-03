import express from "express";
import categoryRoutes from "./category.routes.js";
import itemRoutes from "./item.routes.js";
import modifierRoutes from "./modifier.routes.js";

const router = express.Router();

router.use("/categories", categoryRoutes);
router.use("/items", itemRoutes);
router.use("/", modifierRoutes);

export default router;
