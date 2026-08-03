import express from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategory,
  updateCategory,
  updateCategoryStatus,
} from "../../../controllers/restaurant/category.controller.js";
import { validate } from "../../../middlewares/validator.js";
import {
  createCategorySchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
} from "../../../validators/category.validator.js";

const router = express.Router();

router.get("/", getAllCategory);
router.post("/", validate(createCategorySchema), createCategory);
router.put("/:id", validate(updateCategorySchema), updateCategory);
router.patch("/:id/status", validate(updateCategoryStatusSchema), updateCategoryStatus);
router.patch("/:id/delete", deleteCategory);

export default router;
