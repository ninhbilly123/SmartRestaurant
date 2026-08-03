import express from "express";
import {
  createOrderItems,
  getOrderItemsByOrderId,
} from "../../controllers/customer/orderItem.controller.js";
import { optionalCustomerAuth } from "../../middlewares/authCustomer.middleware.js";
import { requireOrderAccess } from "../../middlewares/customerAccess.middleware.js";
import { validate } from "../../middlewares/validator.js";
import { orderItemSchemas } from "../../validators/orderItem.validator.js";

const router = express.Router();

router.get(
  "/order/:orderId",
  optionalCustomerAuth,
  validate(orderItemSchemas.orderIdParam, "params"),
  requireOrderAccess((req) => req.params.orderId),
  getOrderItemsByOrderId
);

router.post(
  "/",
  optionalCustomerAuth,
  validate(orderItemSchemas.createOrderItems),
  requireOrderAccess((req) => req.body.order_id),
  createOrderItems
);

export default router;
