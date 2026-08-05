import Joi from "joi";

const idSchema = Joi.string().uuid().required();

const modifierSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  optionId: Joi.string().uuid().optional(),
  modifier_option_id: Joi.string().uuid().optional(),
})
  .or("id", "optionId", "modifier_option_id")
  .required();

const orderItemSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  menu_item_id: Joi.string().uuid().optional(),
  quantity: Joi.number().integer().min(1).required(),
  notes: Joi.string().allow("", null).optional(),
  modifiers: Joi.array().items(modifierSchema).default([]),
})
  .or("id", "menu_item_id")
  .required();

export const createOrderSchema = Joi.object({
  table_id: idSchema.messages({
    "string.guid": "Ma ban phai la UUID hop le",
    "any.required": "Ma ban la bat buoc",
  }),
  note: Joi.string().allow("", null).optional(),
  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    "array.base": "Danh sach mon an phai la mot mang",
    "array.min": "Danh sach mon an khong duoc rong",
    "any.required": "Danh sach mon an la bat buoc",
  }),
});

export default {
  createOrderSchema,
};
