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
import { validate } from "../../../middlewares/validator.js";
import { attachModifierGroupsSchema } from "../../../validators/menuItemModifierGroup.validator.js";
import {
  createModifierGroupSchema,
  updateModifierGroupSchema,
} from "../../../validators/modifierGroup.validator.js";
import {
  createModifierOptionSchema,
  updateModifierOptionSchema,
} from "../../../validators/modifierOption.validator.js";

const router = express.Router();

router.get("/modifier-groups", getAllModifierGroups);
router.get("/modifier-groups/:id", getModifierGroupById);
router.post("/modifier-groups", validate(createModifierGroupSchema), createModifierGroup);
router.put("/modifier-groups/:id", validate(updateModifierGroupSchema), updateModifierGroup);
router.delete("/modifier-groups/:id", deleteModifierGroup);

router.post("/modifier-groups/:id/options", validate(createModifierOptionSchema), createModifierOption);
router.put("/modifier-options/:id", validate(updateModifierOptionSchema), updateModifierOption);
router.delete("/modifier-options/:id", deleteModifierOption);

router.post("/items/:id/modifier-groups", validate(attachModifierGroupsSchema), attachModifierGroup);

export default router;
