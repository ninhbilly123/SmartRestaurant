import { PAYMENT_METHODS } from "../models/order.js";

export const validatePaymentMethod = (req, res, next) => {
  const { payment_method: paymentMethod } = req.body;

  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      error: "Phương thức thanh toán không hợp lệ",
    });
  }

  return next();
};

export const validatePaymentCompletion = (req, res, next) => {
  const { payment_method: paymentMethod, transaction_id: transactionId } =
    req.body;

  if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      error: "Phương thức thanh toán không hợp lệ",
    });
  }

  if (transactionId && typeof transactionId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Mã giao dịch không hợp lệ",
    });
  }

  return next();
};

export const validateOrderIdBody = (req, res, next) => {
  if (!req.body.orderId) {
    return res.status(400).json({
      success: false,
      error: "Thiếu orderId",
    });
  }

  return next();
};
