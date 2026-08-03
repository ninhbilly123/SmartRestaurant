import logger from "../../config/logger.js";
import paymentService from "../../services/customerPayment.service.js";

const handleError = (res, error, fallback) => {
  return res.status(error.status || 500).json({
    success: false,
    error: error.message || fallback,
  });
};

export const requestPayment = async (req, res) => {
  try {
    const order = await paymentService.requestPayment({
      io: req.io,
      orderId: req.params.orderId,
    });

    return res.json({
      success: true,
      message:
        "Đã gửi yêu cầu thanh toán. Vui lòng đợi nhân viên xác nhận.",
      data: order,
    });
  } catch (error) {
    logger.error("Request payment error:", error);
    return handleError(res, error, "Lỗi máy chủ khi yêu cầu thanh toán");
  }
};

export const selectPaymentMethod = async (req, res) => {
  try {
    const order = await paymentService.selectPaymentMethod({
      io: req.io,
      orderId: req.params.orderId,
      paymentMethod: req.body.payment_method,
    });

    return res.json({
      success: true,
      message: `Đã chọn phương thức: ${req.body.payment_method}`,
      data: order,
    });
  } catch (error) {
    logger.error("Select payment method error:", error);
    return handleError(
      res,
      error,
      "Lỗi máy chủ khi chọn phương thức thanh toán",
    );
  }
};

export const completePayment = async (req, res) => {
  try {
    const order = await paymentService.completePayment({
      io: req.io,
      orderId: req.params.orderId,
      paymentMethod: req.body.payment_method,
      transactionId: req.body.transaction_id,
    });

    return res.json({
      success: true,
      message: "Thanh toán thành công",
      data: order,
    });
  } catch (error) {
    logger.error("Complete payment error:", error);
    return handleError(res, error, "Lỗi máy chủ khi hoàn tất thanh toán");
  }
};

export const vnpayCallback = async (req, res) => {
  try {
    const redirectUrl = await paymentService.handleVnpayCallback({
      io: req.io,
      orderId: req.query.orderId,
      status: req.query.status,
      transactionId: req.query.transactionId,
    });

    return res.redirect(redirectUrl);
  } catch (error) {
    logger.error("VNPay callback error:", error);
    return res.status(500).send("Payment processing error");
  }
};

export const momoPayment = async (req, res) => {
  try {
    const result = await paymentService.createMomoPayment({
      orderId: req.body.orderId,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error("MoMo payment error:", error);

    if (error.response) {
      return res.status(500).json({
        success: false,
        message: "Lỗi từ MoMo",
        error: error.response.data,
      });
    }

    return handleError(res, error, "Lỗi khi tạo thanh toán MoMo");
  }
};

export const momoCallback = async (req, res) => {
  try {
    await paymentService.handleMomoCallback({
      body: req.body,
      io: req.io,
    });

    return res.status(204).send();
  } catch (error) {
    logger.error("MoMo callback error:", error);
    return res.status(204).send();
  }
};

export const checkStatus = async (req, res) => {
  try {
    const result = await paymentService.checkStatus({
      orderId: req.body.orderId,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error("MoMo status check error:", error);
    return handleError(res, error, "Không thể kiểm tra trạng thái thanh toán");
  }
};
