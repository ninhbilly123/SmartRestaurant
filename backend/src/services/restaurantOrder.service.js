import { Op } from "sequelize";
import db from "../models/index.js";

const { Order, OrderItem, OrderItemModifier, MenuItem, ModifierOption, Table } =
  db;

const ORDER_LIST_INCLUDE = [
  {
    model: Table,
    as: "table",
    attributes: ["id", "table_number"],
  },
  {
    model: OrderItem,
    as: "items",
    include: [
      {
        model: MenuItem,
        as: "menu_item",
        attributes: ["name", "price"],
      },
      {
        model: OrderItemModifier,
        as: "modifiers",
        include: [
          {
            model: ModifierOption,
            as: "modifier_option",
            attributes: ["name", "price_adjustment"],
          },
        ],
      },
    ],
  },
];

const FULL_ORDER_INCLUDE = [
  {
    model: OrderItem,
    as: "items",
    include: [
      { model: MenuItem, as: "menu_item" },
      {
        model: OrderItemModifier,
        as: "modifiers",
        include: [{ model: ModifierOption, as: "modifier_option" }],
      },
    ],
  },
  { model: Table, as: "table" },
];

const assertOrder = async (orderId) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    const error = new Error("Không tìm thấy đơn hàng");
    error.status = 404;
    throw error;
  }

  return order;
};

const getFullOrder = (orderId) =>
  Order.findByPk(orderId, { include: FULL_ORDER_INCLUDE });

const emitOrderUpdate = (io, order) => {
  if (!io || !order) return;

  if (order.table_id) {
    io.emit(`order_update_table_${order.table_id}`, order);
  }
  io.emit("order_status_updated", order);
};

export const getAllOrders = async () => {
  return Order.findAll({
    where: {
      status: {
        [Op.notIn]: ["completed", "cancelled"],
      },
    },
    include: ORDER_LIST_INCLUDE,
    order: [["created_at", "DESC"]],
  });
};

export const updateOrderStatus = async ({ io, orderId, reason, status }) => {
  const order = await assertOrder(orderId);
  let finalOrderStatus = status;

  if (status === "confirmed") {
    await OrderItem.update(
      { status: "confirmed" },
      { where: { order_id: orderId, status: "pending" } },
    );
    finalOrderStatus = "confirmed";
  } else if (status === "preparing") {
    await OrderItem.update(
      { status: "preparing" },
      { where: { order_id: orderId, status: "confirmed" } },
    );
    finalOrderStatus = "preparing";
  } else if (status === "ready") {
    await OrderItem.update(
      { status: "ready" },
      { where: { order_id: orderId, status: "preparing" } },
    );

    const countNotReady = await OrderItem.count({
      where: {
        order_id: orderId,
        status: { [Op.notIn]: ["ready", "cancelled", "served"] },
      },
    });

    finalOrderStatus = countNotReady === 0 ? "ready" : order.status;
  } else if (status === "served") {
    await OrderItem.update(
      { status: "served" },
      { where: { order_id: orderId, status: "ready" } },
    );

    const countNotServed = await OrderItem.count({
      where: {
        order_id: orderId,
        status: { [Op.notIn]: ["served", "cancelled"] },
      },
    });

    finalOrderStatus = countNotServed === 0 ? "served" : order.status;
  } else if (status === "cancelled") {
    await OrderItem.update(
      { status: "cancelled", reject_reason: reason },
      { where: { order_id: orderId } },
    );
    finalOrderStatus = "cancelled";
  } else if (status === "payment_request") {
    finalOrderStatus = "payment_request";
  }

  order.status = finalOrderStatus;
  await order.save();

  const updatedOrder = await getFullOrder(orderId);
  emitOrderUpdate(io, updatedOrder);

  if (io && finalOrderStatus === "confirmed") {
    io.emit("order_confirmed", updatedOrder);
  }

  return updatedOrder;
};

export const confirmBill = async ({
  discountType,
  discountValue,
  io,
  note,
  orderId,
  taxAmount,
}) => {
  const order = await assertOrder(orderId);

  const items = await OrderItem.findAll({
    where: { order_id: orderId, status: { [Op.not]: "cancelled" } },
    include: [
      { model: MenuItem, as: "menu_item", attributes: ["price"] },
      {
        model: OrderItemModifier,
        as: "modifiers",
        include: [
          {
            model: ModifierOption,
            as: "modifier_option",
            attributes: ["price_adjustment"],
          },
        ],
      },
    ],
  });

  const calculatedSubtotal = items.reduce((subtotal, item) => {
    const basePrice = parseFloat(item.menu_item?.price || 0);
    const modifiersTotal = (item.modifiers || []).reduce(
      (sum, modifier) =>
        sum + parseFloat(modifier.modifier_option?.price_adjustment || 0),
      0,
    );

    return subtotal + (basePrice + modifiersTotal) * item.quantity;
  }, 0);

  const parsedDiscountValue = parseFloat(discountValue || 0);
  let discountAmount = 0;
  if (discountType === "percent") {
    discountAmount = (calculatedSubtotal * parsedDiscountValue) / 100;
  } else if (discountType === "fixed") {
    discountAmount = parsedDiscountValue;
  }

  const tax = parseFloat(taxAmount || 0);
  const finalTotal = calculatedSubtotal + tax - discountAmount;

  order.subtotal = calculatedSubtotal;
  order.discount_type = discountType;
  order.discount_value = parsedDiscountValue;
  order.tax_amount = tax;
  order.total_amount = finalTotal > 0 ? finalTotal : 0;
  order.note = note;
  order.status = "payment_pending";
  await order.save();

  const fullOrder = await getFullOrder(orderId);
  emitOrderUpdate(io, fullOrder);
  if (io && order.table_id) {
    io.emit(`bill_confirmed_table_${order.table_id}`, fullOrder);
  }

  return fullOrder;
};

export const markAsPaid = async ({ io, orderId, paymentMethod = "cash" }) => {
  const order = await assertOrder(orderId);

  order.status = "completed";
  order.payment_method = paymentMethod;
  order.completed_at = new Date();
  await order.save();

  emitOrderUpdate(io, order);
  if (io) {
    io.emit("table_status_updated", {
      tableId: order.table_id,
      status: "available",
    });
    io.emit(`payment_success_table_${order.table_id}`, { orderId });
  }

  return order;
};

export const rejectOrderItem = async ({ io, itemId, reason }) => {
  const item = await OrderItem.findByPk(itemId, {
    include: [
      { model: MenuItem, as: "menu_item" },
      {
        model: OrderItemModifier,
        as: "modifiers",
        include: [{ model: ModifierOption, as: "modifier_option" }],
      },
    ],
  });

  if (!item) {
    const error = new Error("Không tìm thấy món");
    error.status = 404;
    throw error;
  }

  const order = await assertOrder(item.order_id);
  if (["payment_pending", "completed"].includes(order.status)) {
    const error = new Error("Không thể hủy món sau khi đã chốt bill");
    error.status = 400;
    throw error;
  }

  const basePrice = parseFloat(item.price_at_order || item.menu_item?.price || 0);
  const modifiersTotal = (item.modifiers || []).reduce((sum, modifier) => {
    return (
      sum +
      parseFloat(
        modifier.price || modifier.modifier_option?.price_adjustment || 0,
      )
    );
  }, 0);
  const itemTotal = (basePrice + modifiersTotal) * item.quantity;

  order.total_amount = Math.max(0, (order.total_amount || 0) - itemTotal);
  await order.save();

  item.status = "cancelled";
  item.reject_reason = reason;
  await item.save();

  const updatedOrder = await getFullOrder(item.order_id);
  emitOrderUpdate(io, updatedOrder);

  return updatedOrder;
};

export default {
  getAllOrders,
  updateOrderStatus,
  confirmBill,
  markAsPaid,
  rejectOrderItem,
};
