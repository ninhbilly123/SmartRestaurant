import express from "express";
import {
  createItem,
  deleteItem,
  getAllItem,
  getItemById,
  updateItem,
} from "../../../controllers/restaurant/item.controller.js";
import {
  handleUploadErrors,
  uploadMenuItemPhotos,
} from "../../../middlewares/uploadMiddleware.js";
import { validate } from "../../../middlewares/validator.js";
import { updateMenuItemSchema } from "../../../validators/item.validator.js";

const router = express.Router();

router.get("/", getAllItem);
router.get("/:id", getItemById);
router.post("/", uploadMenuItemPhotos, handleUploadErrors, createItem);
router.put("/:id", validate(updateMenuItemSchema), updateItem);
router.delete("/:id", deleteItem);

export default router;
