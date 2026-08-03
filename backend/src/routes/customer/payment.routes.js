import express from 'express';
import * as paymentController from '../../controllers/customer/payment.controller.js';
import { optionalCustomerAuth } from '../../middlewares/authCustomer.middleware.js';
import { requireOrderAccess } from '../../middlewares/customerAccess.middleware.js';
import {
  validateOrderIdBody,
  validatePaymentCompletion,
  validatePaymentMethod,
} from '../../middlewares/payment.middleware.js';

const router = express.Router();

// Yêu cầu thanh toán (Customer bấm "Request Bill")
router.post(
  '/orders/:orderId/request-payment',
  optionalCustomerAuth,
  requireOrderAccess(),
  paymentController.requestPayment
);

// Chọn phương thức thanh toán (Customer chọn Cash/MoMo/VNPay)
router.post(
  '/orders/:orderId/select-payment-method',
  optionalCustomerAuth,
  requireOrderAccess(),
  validatePaymentMethod,
  paymentController.selectPaymentMethod
);

// Hoàn tất thanh toán (Sau khi payment gateway xác nhận)
router.post(
  '/orders/:orderId/complete-payment',
  optionalCustomerAuth,
  requireOrderAccess(),
  validatePaymentCompletion,
  paymentController.completePayment
);

// Payment Gateway
router.get('/payment/vnpay-callback', paymentController.vnpayCallback);
router.post(
  '/payment/momo/create',
  validateOrderIdBody,
  optionalCustomerAuth,
  requireOrderAccess((req) => req.body.orderId),
  paymentController.momoPayment
);
// Backward compatible alias for older frontend code.
router.post(
  '/payment/momo-callback',
  validateOrderIdBody,
  optionalCustomerAuth,
  requireOrderAccess((req) => req.body.orderId),
  paymentController.momoPayment
);
router.post('/payment/callback', paymentController.momoCallback);
router.post(
  '/payment/check-status',
  validateOrderIdBody,
  optionalCustomerAuth,
  requireOrderAccess((req) => req.body.orderId),
  paymentController.checkStatus
);

export default router;
