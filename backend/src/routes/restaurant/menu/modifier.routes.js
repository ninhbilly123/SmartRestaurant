import express from "express";
import {
  attachModifierGroup,
  createModifierGroup,
  createModifierOption,
  deleteModifierGroup,
  deleteModifierOption,
  getAllModifierGroups,
  getModifierGroupById,
  updateModifierGroup,
  updateModifierOption,
} from "../../../controllers/restaurant/modifier.controller.js";

const router = express.Router();

router.get("/modifier-groups", getAllModifierGroups);
router.get("/modifier-groups/:id", getModifierGroupById);
router.post("/modifier-groups", createModifierGroup);
router.put("/modifier-groups/:id", updateModifierGroup);
router.delete("/modifier-groups/:id", deleteModifierGroup);

router.post("/modifier-groups/:id/options", createModifierOption);
router.put("/modifier-options/:id", updateModifierOption);
router.delete("/modifier-options/:id", deleteModifierOption);

router.post("/items/:id/modifier-groups", attachModifierGroup);

export default router;
