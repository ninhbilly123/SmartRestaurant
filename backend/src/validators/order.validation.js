import Joi from "joi";

const idSchema = Joi.string().uuid().required();
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

const orderItemSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  menu_item_id: Joi.string().uuid().optional(),
  quantity: Joi.number().integer().min(1).required(),
  notes: Joi.string().allow("", null).optional(),
  modifiers: modifiersSchema,
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
