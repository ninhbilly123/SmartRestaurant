import express from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategory,
  updateCategory,
  updateCategoryStatus,
} from "../../../controllers/restaurant/category.controller.js";

const router = express.Router();

router.get("/", getAllCategory);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.patch("/:id/status", updateCategoryStatus);
router.patch("/:id/delete", deleteCategory);

export default router;
