import Joi from "joi";

const uuid = Joi.string().uuid().required();

export const reviewSchemas = {
  createReview: Joi.object({
    menu_item_id: uuid.messages({
      "any.required": "Mã món ăn là bắt buộc",
      "string.guid": "Mã món ăn không hợp lệ",
    }),
    order_id: uuid.messages({
      "any.required": "Mã đơn hàng là bắt buộc",
      "string.guid": "Mã đơn hàng không hợp lệ",
    }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
      "any.required": "Điểm đánh giá là bắt buộc",
      "number.min": "Điểm đánh giá tối thiểu là 1",
      "number.max": "Điểm đánh giá tối đa là 5",
    }),
    comment: Joi.string().allow("", null).max(1000).optional(),
    customer_name: Joi.string().allow("", null).max(100).optional(),
  }),

  updateReview: Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional(),
    comment: Joi.string().allow("", null).max(1000).optional(),
  }).min(1),

  orderIdParam: Joi.object({
    orderId: uuid,
  }),

  reviewIdParam: Joi.object({
    id: uuid,
  }),
};
