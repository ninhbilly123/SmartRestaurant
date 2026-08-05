import Joi from "joi";

const idSchema = Joi.string().uuid();

const modifierSchema = Joi.object({
  id: idSchema.optional(),
  optionId: idSchema.optional(),
  modifier_option_id: idSchema.optional(),
})
  .or("id", "optionId", "modifier_option_id");

const orderItemPayloadSchema = Joi.object({
  menu_item_id: idSchema.optional(),
  id: idSchema.optional(),
  quantity: Joi.number().integer().min(1).required(),
  notes: Joi.string().allow("", null).optional(),
  modifiers: Joi.array().items(modifierSchema).default([]),
})
  .or("menu_item_id", "id");

export const orderItemSchemas = {
  createOrderItems: Joi.object({
    order_id: Joi.string().uuid().required().messages({
      "string.guid": "ID đơn hàng phải là UUID hợp lệ",
      "any.required": "ID đơn hàng là bắt buộc",
    }),
    items: Joi.array().items(orderItemPayloadSchema).min(1).required().messages({
      "array.base": "Danh sách món ăn không hợp lệ",
      "array.min": "Danh sách món ăn không được rỗng",
      "any.required": "Danh sách món ăn là bắt buộc",
    }),
  }),

  orderIdParam: Joi.object({
    orderId: Joi.string().uuid().required(),
  }),

  itemIdParam: Joi.object({
    itemId: Joi.string().uuid().required(),
  }),
};
