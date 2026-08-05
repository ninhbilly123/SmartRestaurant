import express from "express";
import * as paymentController from "../../controllers/customer/payment.controller.js";
import { optionalCustomerAuth } from "../../middlewares/authCustomer.middleware.js";
import { requireOrderAccess } from "../../middlewares/customerAccess.middleware.js";
import {
  validateOrderIdBody,
  validatePaymentMethod,
} from "../../middlewares/payment.middleware.js";

const router = express.Router();

router.post(
  "/orders/:orderId/request-payment",
  optionalCustomerAuth,
  requireOrderAccess(),
  paymentController.requestPayment,
);

router.post(
  "/orders/:orderId/select-payment-method",
  optionalCustomerAuth,
  requireOrderAccess(),
  validatePaymentMethod,
  paymentController.selectPaymentMethod,
);

router.get("/payment/vnpay-callback", paymentController.vnpayCallback);
router.post(
  "/payment/momo/create",
  validateOrderIdBody,
  optionalCustomerAuth,
  requireOrderAccess((req) => req.body.orderId),
  paymentController.momoPayment,
);
router.post("/payment/callback", paymentController.momoCallback);
router.post(
  "/payment/check-status",
  validateOrderIdBody,
  optionalCustomerAuth,
  requireOrderAccess((req) => req.body.orderId),
  paymentController.checkStatus,
);

export default router;
