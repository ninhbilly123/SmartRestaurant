import Order from "../../models/order.js";
import { createMomoPayment, queryMomoPaymentStatus } from "../../services/payment/momo.service.js";

/**
 * [CUSTOMER] Yêu cầu thanh toán (Bước 1: Chỉ gọi bill, chưa chọn phương thức)
 * POST /api/customer/orders/:orderId/request-payment
 * Body: RỖNG (không cần payment_method)
 */
export const requestPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1. Lấy thông tin order
    const order = await Order.findByPk(orderId, {
      include: [
        {
          association: "items",
          include: [
            "menu_item",
            { association: "modifiers", include: ["modifier_option"] },
          ],
        },
        { association: "table" },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy đơn hàng",
      });
    }

    // [UPDATE] Thêm check cho các trạng thái mới
    if (["payment_request", "payment_pending", "completed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: "Đơn hàng đã được yêu cầu thanh toán hoặc đã hoàn tất",
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "Đơn hàng đã bị hủy",
      });
    }

    // 3. Kiểm tra TẤT CẢ món đã served chưa
    const items = order.items || [];
    const activeItems = items.filter((i) => i.status !== "cancelled");

    if (activeItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Không có món nào trong đơn hàng",
      });
    }

    const allServed = activeItems.every((i) => i.status === "served");
    if (!allServed) {
      const unservedCount = activeItems.filter(
        (i) => i.status !== "served"
      ).length;
      return res.status(400).json({
        success: false,
        error: `Vui lòng đợi tất cả món được phục vụ (còn ${unservedCount} món chưa lên)`,
      });
    }

    // 4. Cập nhật trạng thái đơn sang 'payment_request' (KHÔNG lưu payment_method)
    order.status = "payment_request";
    await order.save();

    // 5. Reload để lấy data đầy đủ
    await order.reload({
      include: [
        {
          association: "items",
          include: [
            "menu_item",
            { association: "modifiers", include: ["modifier_option"] },
          ],
        },
        { association: "table" },
      ],
    });

    // 6. Emit socket thông báo Waiter
    req.io.emit("order_status_updated", order);

    if (order.table_id) {
      req.io.emit(`order_update_table_${order.table_id}`, order);
    }

    return res.json({
      success: true,
      message: "Đã gửi yêu cầu thanh toán. Vui lòng đợi nhân viên xác nhận.",
      data: order,
    });
  } catch (error) {
    console.error("Request payment error:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ khi yêu cầu thanh toán",
    });
  }
};

/**
 * [CUSTOMER] Chọn phương thức thanh toán (Bước 3: Sau khi waiter chốt bill)
 * POST /api/customer/orders/:orderId/select-payment-method
 * Body: { payment_method: 'cash' | 'momo' | 'vnpay' }
 */
export const selectPaymentMethod = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_method } = req.body;

    if (!payment_method) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng chọn phương thức thanh toán",
      });
    }

    // 1. Lấy thông tin order
    const order = await Order.findByPk(orderId, {
      include: [
        {
          association: "items",
          include: [
            "menu_item",
            { association: "modifiers", include: ["modifier_option"] },
          ],
        },
        { association: "table" },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy đơn hàng",
      });
    }

    // 2. Kiểm tra trạng thái phải là payment_pending
    if (order.status !== "payment_pending") {
      return res.status(400).json({
        success: false,
        error: "Đơn hàng chưa sẵn sàng thanh toán. Vui lòng đợi nhân viên chốt hóa đơn.",
      });
    }

    // 3. Lưu phương thức thanh toán
    order.payment_method = payment_method;
    await order.save();

    // 4. Reload để lấy data đầy đủ
    await order.reload({
      include: [
        {
          association: "items",
          include: [
            "menu_item",
            { association: "modifiers", include: ["modifier_option"] },
          ],
        },
        { association: "table" },
      ],
    });

    // 5. Emit socket để waiter biết khách đã chọn phương thức
    if (req.io) {
      req.io.emit("order_status_updated", order);
      if (order.table_id) {
        req.io.emit(`order_update_table_${order.table_id}`, order);
      }
    }

    return res.json({
      success: true,
      message: `Đã chọn phương thức: ${payment_method}`,
      data: order,
    });
  } catch (error) {
    console.error("Select payment method error:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ khi chọn phương thức thanh toán",
    });
  }
};

/**
 * [CUSTOMER] Hoàn tất thanh toán (sau khi payment gateway callback)
 * POST /api/customer/orders/:orderId/complete-payment
 * Body: { transaction_id: string, payment_method: string }
 */
export const completePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { transaction_id, payment_method } = req.body;

    const order = await Order.findByPk(orderId, {
      include: [
        {
          association: "items",
          include: [
            "menu_item",
            { association: "modifiers", include: ["modifier_option"] },
          ],
        },
        { association: "table" },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy đơn hàng",
      });
    }

    if (order.status !== "payment_pending") {
      return res.status(400).json({
        success: false,
        error: "Đơn hàng chưa được nhân viên xác nhận hóa đơn.",
      });
    }

    // Cập nhật thông tin thanh toán
    order.status = "completed";
    order.transaction_id = transaction_id;
    order.payment_method = payment_method || order.payment_method;
    order.completed_at = new Date();
    await order.save();

    // Reload data
    await order.reload({
      include: [
        {
          association: "items",
          include: [
            "menu_item",
            { association: "modifiers", include: ["modifier_option"] },
          ],
        },
        { association: "table" },
      ],
    });

    // Emit socket
    req.io.emit("order_status_updated", order);

    if (order.table_id) {
      req.io.emit(`order_update_table_${order.table_id}`, order);
    }

    return res.json({
      success: true,
      message: "Thanh toán thành công",
      data: order,
    });
  } catch (error) {
    console.error("Complete payment error:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi máy chủ khi hoàn tất thanh toán",
    });
  }
};

/**
 * [MOCK] VNPay Payment Callback
 * GET /api/customer/payment/vnpay-callback?orderId=xxx&status=success
 */
export const vnpayCallback = async (req, res) => {
  try {
    const { orderId, status, transactionId } = req.query;

    if (status === "success") {
      // Gọi completePayment
      const order = await Order.findByPk(orderId);
      if (order && order.status === "payment_pending") {
        order.status = "completed";
        order.transaction_id = transactionId || `VNPAY_${Date.now()}`;
        order.completed_at = new Date();
        await order.save();

        // Emit socket
        await order.reload({
          include: [
            {
              association: "items",
              include: [
                "menu_item",
                { association: "modifiers", include: ["modifier_option"] },
              ],
            },
            { association: "table" },
          ],
        });
        req.io.emit("order_status_updated", order);
        if (order.table_id) {
          req.io.emit(`order_update_table_${order.table_id}`, order);
        }
      }

      // Redirect về trang success
      return res.redirect(`/customer/payment-success?orderId=${orderId}`);
    } else {
      return res.redirect(`/customer/payment-failed?orderId=${orderId}`);
    }
  } catch (error) {
    console.error("VNPay callback error:", error);
    return res.status(500).send("Payment processing error");
  }
};

/**
 * Tạo thanh toán MoMo
 * POST /api/customer/payment/momo/create
 * Body: { orderId: string, amount: string }
 */
export const momoPayment = async (req, res) => {
  try {
    //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
    const { orderId: customerOrderId } = req.body;

    // Validate input
    if (!customerOrderId) {
      return res.status(400).json({
        success: false,
        error: "Thiếu orderId",
      });
    }

    // Kiểm tra order tồn tại
    const order = await Order.findByPk(customerOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy đơn hàng",
      });
    }

    if (order.status !== 'payment_pending') {
        return res.status(400).json({ 
            success: false, 
            error: "Vui lòng đợi nhân viên xác nhận hóa đơn (Discount/Thuế) trước khi thanh toán." 
        });
    }

    const result = await createMomoPayment({ order });
    return res.status(200).json(result);
  } catch (error) {
    console.error("MoMo payment error:", error);
    // Log chi tiết response từ MoMo nếu có
    if (error.response) {
      console.error("MoMo Error Response:", error.response.data);
      return res.status(500).json({
        success: false,
        message: "Lỗi từ MoMo",
        error: error.response.data,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo thanh toán MoMo",
      error: error.message,
    });
  }
};

export const momoCallback = async (req, res) => {
  try {
    const {
      resultCode,
      orderId: momoOrderId,
      transId,
      amount,
      extraData,
      message,
    } = req.body;

    // Parse extraData để lấy customerOrderId
    let customerOrderId = null;
    if (extraData) {
      try {
        const decodedData = JSON.parse(
          Buffer.from(extraData, "base64").toString("utf8")
        );
        customerOrderId = decodedData.customerOrderId;
      } catch (parseError) {
        console.error("Error parsing extraData:", parseError);
      }
    }

    // Kiểm tra kết quả thanh toán (resultCode = 0 là thành công)
    if (resultCode === 0 && customerOrderId) {
      // Tìm order và cập nhật trạng thái
      const order = await Order.findByPk(customerOrderId, {
        include: [
          {
            association: "items",
            include: [
              "menu_item",
              { association: "modifiers", include: ["modifier_option"] },
            ],
          },
          { association: "table" },
        ],
      });

      if (order && order.status === "payment_pending") {
        order.status = "completed";
        order.transaction_id = transId || momoOrderId;
        order.payment_method = "momo";
        order.completed_at = new Date();
        await order.save();

        // Reload và emit socket
        await order.reload({
          include: [
            {
              association: "items",
              include: [
                "menu_item",
                { association: "modifiers", include: ["modifier_option"] },
              ],
            },
            { association: "table" },
          ],
        });

        if (req.io) {
          req.io.emit("order_status_updated", order);
          if (order.table_id) {
            req.io.emit(`order_update_table_${order.table_id}`, order);
          }
        }
      }
    }

    // MoMo yêu cầu trả về 204 No Content để xác nhận đã nhận IPN
    return res.status(204).send();
  } catch (error) {
    console.error("MoMo callback error:", error);
    // Vẫn trả về 204 để MoMo không gửi lại IPN
    return res.status(204).send();
  }
};

export const checkStatus = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: "Thiếu orderId",
    });
  }

  const result = await queryMomoPaymentStatus(orderId);

  return res.status(200).json(result);
};
