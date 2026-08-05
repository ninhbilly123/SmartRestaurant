import { Transaction } from "sequelize";
import db from "../models/index.js";
import {
  createMomoPayment as createMomoGatewayPayment,
  queryMomoPaymentStatus,
  verifyMomoCallbackSignature,
} from "./payment/momo.service.js";

const { Order, sequelize } = db;

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

const findOrderWithDetails = async (orderId, options = {}) => {
  const order = await Order.findByPk(orderId, {
    include: ORDER_INCLUDE,
    ...options,
  });

  if (!order) {
    const error = new Error("Khong tim thay don hang");
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

const emitPaymentSuccess = (io, order) => {
  if (!io || !order?.table_id) return;
  io.emit(`payment_success_table_${order.table_id}`, { orderId: order.id });
};

const decodeMomoExtraData = (extraData) => {
  if (!extraData) return {};

  try {
    return JSON.parse(Buffer.from(extraData, "base64").toString("utf8"));
  } catch {
    const error = new Error("Du lieu extraData cua MoMo khong hop le");
    error.status = 400;
    throw error;
  }
};

const completeGatewayOrder = async ({
  io,
  orderId,
  paymentMethod,
  transactionId,
}) => {
  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const order = await Order.findByPk(orderId, {
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    if (!order) {
      const error = new Error("Khong tim thay don hang");
      error.status = 404;
      throw error;
    }

    if (order.status === "completed") {
      await transaction.commit();
      committed = true;
      const completedOrder = await findOrderWithDetails(orderId);
      emitOrderUpdate(io, completedOrder);
      emitPaymentSuccess(io, completedOrder);
      return completedOrder;
    }

    if (order.status !== "payment_pending") {
      const error = new Error("Don hang chua san sang thanh toan");
      error.status = 400;
      throw error;
    }

    order.status = "completed";
    order.transaction_id = transactionId;
    order.payment_method = paymentMethod;
    order.completed_at = new Date();
    await order.save({ transaction });

    await transaction.commit();
    committed = true;

    const completedOrder = await findOrderWithDetails(orderId);
    emitOrderUpdate(io, completedOrder);
    emitPaymentSuccess(io, completedOrder);
    return completedOrder;
  } catch (error) {
    if (!committed) {
      await transaction.rollback();
    }
    throw error;
  }
};

export const requestPayment = async ({ io, orderId }) => {
  const order = await findOrderWithDetails(orderId);

  if (["payment_request", "payment_pending", "completed"].includes(order.status)) {
    const error = new Error(
      "Don hang da duoc yeu cau thanh toan hoac da hoan tat",
    );
    error.status = 400;
    throw error;
  }

  if (order.status === "cancelled") {
    const error = new Error("Don hang da bi huy");
    error.status = 400;
    throw error;
  }

  const activeItems = (order.items || []).filter(
    (item) => item.status !== "cancelled",
  );

  if (activeItems.length === 0) {
    const error = new Error("Khong co mon nao trong don hang");
    error.status = 400;
    throw error;
  }

  const unservedCount = activeItems.filter(
    (item) => item.status !== "served",
  ).length;

  if (unservedCount > 0) {
    const error = new Error(
      `Vui long doi tat ca mon duoc phuc vu (con ${unservedCount} mon chua len)`,
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
      "Don hang chua san sang thanh toan. Vui long doi nhan vien chot hoa don.",
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

export const handleVnpayCallback = async ({ orderId }) => {
  const params = new URLSearchParams({
    orderId: orderId || "",
    message: "Cong thanh toan VNPay chua duoc cau hinh xac minh chu ky",
  });

  return `/customer/payment-failed?${params.toString()}`;
};

export const createMomoPayment = async ({ orderId }) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    const error = new Error("Khong tim thay don hang");
    error.status = 404;
    throw error;
  }

  if (order.status !== "payment_pending") {
    const error = new Error(
      "Vui long doi nhan vien xac nhan hoa don truoc khi thanh toan.",
    );
    error.status = 400;
    throw error;
  }

  return createMomoGatewayPayment({ order });
};

export const handleMomoCallback = async ({ body, io }) => {
  if (!verifyMomoCallbackSignature(body)) {
    const error = new Error("Chu ky callback MoMo khong hop le");
    error.status = 400;
    throw error;
  }

  const { resultCode, orderId: momoOrderId, transId, extraData } = body;
  const decodedData = decodeMomoExtraData(extraData);
  const customerOrderId = decodedData.customerOrderId;

  if (!customerOrderId) {
    const error = new Error("Callback MoMo thieu ma don hang noi bo");
    error.status = 400;
    throw error;
  }

  if (Number(resultCode) !== 0) {
    return null;
  }

  return completeGatewayOrder({
    io,
    orderId: customerOrderId,
    paymentMethod: "momo",
    transactionId: transId || momoOrderId,
  });
};

export const checkStatus = async ({ orderId }) => {
  return queryMomoPaymentStatus(orderId);
};

export default {
  requestPayment,
  selectPaymentMethod,
  handleVnpayCallback,
  createMomoPayment,
  handleMomoCallback,
  checkStatus,
};
