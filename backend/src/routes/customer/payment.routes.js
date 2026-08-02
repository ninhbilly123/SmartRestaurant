import express from 'express';
import * as paymentController from '../../controllers/customer/payment.controller.js';

const router = express.Router();

// Yêu cầu thanh toán (Customer bấm "Request Bill")
router.post('/orders/:orderId/request-payment', paymentController.requestPayment);

// Chọn phương thức thanh toán (Customer chọn Cash/MoMo/VNPay)
router.post('/orders/:orderId/select-payment-method', paymentController.selectPaymentMethod);

// Hoàn tất thanh toán (Sau khi payment gateway xác nhận)
router.post('/orders/:orderId/complete-payment', paymentController.completePayment);

// Payment Gateway
router.get('/payment/vnpay-callback', paymentController.vnpayCallback);
router.post('/payment/momo/create', paymentController.momoPayment);
// Backward compatible alias for older frontend code.
router.post('/payment/momo-callback', paymentController.momoPayment);
router.post('/payment/callback', paymentController.momoCallback)
router.post('/payment/check-status', paymentController.checkStatus);

export default router;
