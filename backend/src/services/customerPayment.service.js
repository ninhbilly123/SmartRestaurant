import Order from "../models/order.js";
import {
  createMomoPayment as createMomoGatewayPayment,
  queryMomoPaymentStatus,
} from "./payment/momo.service.js";

const ORDER_INCLUDE = [
  {
    association: "items",
    include: [
      "menu_item",
      { association: "modifiers", include: ["modifier_option"] },
    ],
  },
  { association: "table" },
];

const findOrderWithDetails = async (orderId) => {
  const order = await Order.findByPk(orderId, { include: ORDER_INCLUDE });
  if (!order) {
    const error = new Error("Không tìm thấy đơn hàng");
    error.status = 404;
    throw error;
  }

  return order;
};

const emitOrderUpdate = (io, order) => {
  if (!io || !order) return;

  io.emit("order_status_updated", order);
  if (order.table_id) {
    io.emit(`order_update_table_${order.table_id}`, order);
  }
};

const completePendingOrder = async ({
  io,
  orderId,
  paymentMethod,
  transactionId,
}) => {
  const order = await findOrderWithDetails(orderId);

  if (order.status !== "payment_pending") {
    const error = new Error("Đơn hàng chưa được nhân viên xác nhận hóa đơn.");
    error.status = 400;
    throw error;
  }

  order.status = "completed";
  order.transaction_id = transactionId;
  order.payment_method = paymentMethod || order.payment_method;
  order.completed_at = new Date();
  await order.save();
  await order.reload({ include: ORDER_INCLUDE });
  emitOrderUpdate(io, order);

  return order;
};

export const requestPayment = async ({ io, orderId }) => {
  const order = await findOrderWithDetails(orderId);

  if (["payment_request", "payment_pending", "completed"].includes(order.status)) {
    const error = new Error(
      "Đơn hàng đã được yêu cầu thanh toán hoặc đã hoàn tất",
    );
    error.status = 400;
    throw error;
  }

  if (order.status === "cancelled") {
    const error = new Error("Đơn hàng đã bị hủy");
    error.status = 400;
    throw error;
  }

  const activeItems = (order.items || []).filter(
    (item) => item.status !== "cancelled",
  );

  if (activeItems.length === 0) {
    const error = new Error("Không có món nào trong đơn hàng");
    error.status = 400;
    throw error;
  }

  const unservedCount = activeItems.filter(
    (item) => item.status !== "served",
  ).length;

  if (unservedCount > 0) {
    const error = new Error(
      `Vui lòng đợi tất cả món được phục vụ (còn ${unservedCount} món chưa lên)`,
    );
    error.status = 400;
    throw error;
  }

  order.status = "payment_request";
  await order.save();
  await order.reload({ include: ORDER_INCLUDE });
  emitOrderUpdate(io, order);

  return order;
};

export const selectPaymentMethod = async ({ io, orderId, paymentMethod }) => {
  const order = await findOrderWithDetails(orderId);

  if (order.status !== "payment_pending") {
    const error = new Error(
      "Đơn hàng chưa sẵn sàng thanh toán. Vui lòng đợi nhân viên chốt hóa đơn.",
    );
    error.status = 400;
    throw error;
  }

  order.payment_method = paymentMethod;
  await order.save();
  await order.reload({ include: ORDER_INCLUDE });
  emitOrderUpdate(io, order);

  return order;
};

export const completePayment = async ({
  io,
  orderId,
  paymentMethod,
  transactionId,
}) => {
  return completePendingOrder({
    io,
    orderId,
    paymentMethod,
    transactionId,
  });
};

export const handleVnpayCallback = async ({
  io,
  orderId,
  status,
  transactionId,
}) => {
  if (status !== "success") {
    return `/customer/payment-failed?orderId=${orderId}`;
  }

  const order = await Order.findByPk(orderId);
  if (order && order.status === "payment_pending") {
    order.status = "completed";
    order.transaction_id = transactionId || `VNPAY_${Date.now()}`;
    order.completed_at = new Date();
    await order.save();
    await order.reload({ include: ORDER_INCLUDE });
    emitOrderUpdate(io, order);
  }

  return `/customer/payment-success?orderId=${orderId}`;
};

export const createMomoPayment = async ({ orderId }) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    const error = new Error("Không tìm thấy đơn hàng");
    error.status = 404;
    throw error;
  }

  if (order.status !== "payment_pending") {
    const error = new Error(
      "Vui lòng đợi nhân viên xác nhận hóa đơn trước khi thanh toán.",
    );
    error.status = 400;
    throw error;
  }

  return createMomoGatewayPayment({ order });
};

export const handleMomoCallback = async ({ body, io }) => {
  const {
    resultCode,
    orderId: momoOrderId,
    transId,
    extraData,
  } = body;

  let customerOrderId = null;
  if (extraData) {
    const decodedData = JSON.parse(
      Buffer.from(extraData, "base64").toString("utf8"),
    );
    customerOrderId = decodedData.customerOrderId;
  }

  if (resultCode === 0 && customerOrderId) {
    const order = await Order.findByPk(customerOrderId, {
      include: ORDER_INCLUDE,
    });

    if (order && order.status === "payment_pending") {
      order.status = "completed";
      order.transaction_id = transId || momoOrderId;
      order.payment_method = "momo";
      order.completed_at = new Date();
      await order.save();
      await order.reload({ include: ORDER_INCLUDE });
      emitOrderUpdate(io, order);
    }
  }
};

export const checkStatus = async ({ orderId }) => {
  return queryMomoPaymentStatus(orderId);
};

export default {
  requestPayment,
  selectPaymentMethod,
  completePayment,
  handleVnpayCallback,
  createMomoPayment,
  handleMomoCallback,
  checkStatus,
};
