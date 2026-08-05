import express from "express";
import {
  createReview,
  getMenuItemReviews,
  getReviewableItems,
  updateReview,
  deleteReview,
} from "../../controllers/customer/review.controller.js";
import {
  optionalCustomerAuth,
  requireCustomerAuth,
} from "../../middlewares/authCustomer.middleware.js";
import { requireOrderAccess } from "../../middlewares/customerAccess.middleware.js";
import { validate } from "../../middlewares/validator.js";
import { reviewSchemas } from "../../validators/review.validator.js";

const router = express.Router();

router.get("/menu-item/:menuItemId", getMenuItemReviews);

router.post(
  "/",
  optionalCustomerAuth,
  validate(reviewSchemas.createReview),
  requireOrderAccess((req) => req.body.order_id),
  createReview,
);

router.get(
  "/order/:orderId/can-review",
  optionalCustomerAuth,
  validate(reviewSchemas.orderIdParam, "params"),
  requireOrderAccess((req) => req.params.orderId),
  getReviewableItems,
);

router.put(
  "/:id",
  requireCustomerAuth,
  validate(reviewSchemas.reviewIdParam, "params"),
  validate(reviewSchemas.updateReview),
  updateReview,
);

router.delete(
  "/:id",
  requireCustomerAuth,
  validate(reviewSchemas.reviewIdParam, "params"),
  deleteReview,
);

export default router;
