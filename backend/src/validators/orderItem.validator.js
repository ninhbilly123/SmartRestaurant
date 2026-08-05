import Joi from "joi";

const idSchema = Joi.string().uuid();
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getModifierOptionId = (modifier) => {
  if (typeof modifier === "string") return modifier;

  return (
    modifier?.modifier_option_id ||
    modifier?.modifierOptionId ||
    modifier?.option_id ||
    modifier?.optionId ||
    modifier?.id ||
    modifier?.modifier_option?.id ||
    modifier?.option?.id
  );
};

const normalizeModifiers = (value, helpers) => {
  if (!Array.isArray(value)) {
    return helpers.error("array.base");
  }

  const normalized = [];

  for (const modifier of value) {
    const modifierOptionId = getModifierOptionId(modifier);

    if (!modifierOptionId) {
      continue;
    }

    if (!uuidPattern.test(String(modifierOptionId))) {
      return helpers.error("any.invalid");
    }

    normalized.push({
      modifier_option_id: String(modifierOptionId),
    });
  }

  return normalized;
};

const modifiersSchema = Joi.array()
  .items(Joi.any())
  .custom(normalizeModifiers, "normalize modifiers")
  .default([]);

const orderItemPayloadSchema = Joi.object({
  menu_item_id: idSchema.optional(),
  id: idSchema.optional(),
  quantity: Joi.number().integer().min(1).required(),
  notes: Joi.string().allow("", null).optional(),
  modifiers: modifiersSchema,
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
