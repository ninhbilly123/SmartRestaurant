import { Op, Transaction } from "sequelize";
import db from "../models/index.js";
import { ORDER_STATUSES, PAYMENT_METHODS } from "../models/order.js";

const { Order, OrderItem, OrderItemModifier, MenuItem, ModifierOption, Table, sequelize } =
  db;

const DIRECT_STATUS_BY_SCOPE = {
  kitchen: ["preparing", "ready"],
  waiter: ["confirmed", "served", "cancelled"],
};

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

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const assertOrder = async (orderId, options = {}) => {
  const order = await Order.findByPk(orderId, options);
  if (!order) {
    throw createError("Khong tim thay don hang", 404);
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

const calculateItemTotal = (item) => {
  const basePrice = Number(item.price_at_order || item.menu_item?.price || 0);
  const modifiersTotal = (item.modifiers || []).reduce(
    (sum, modifier) =>
      sum + Number(modifier.price || modifier.modifier_option?.price_adjustment || 0),
    0,
  );

  return (basePrice + modifiersTotal) * Number(item.quantity || 0);
};

const loadBillableItems = (orderId, transaction = null) =>
  OrderItem.findAll({
    where: { order_id: orderId, status: { [Op.ne]: "cancelled" } },
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
    transaction,
  });

const calculateSubtotal = (items) =>
  items.reduce((subtotal, item) => subtotal + calculateItemTotal(item), 0);

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

export const updateOrderStatus = async ({
  io,
  orderId,
  reason,
  scope = "waiter",
  status,
}) => {
  if (!ORDER_STATUSES.includes(status)) {
    throw createError("Trang thai don hang khong hop le");
  }

  const allowedStatuses = DIRECT_STATUS_BY_SCOPE[scope] || DIRECT_STATUS_BY_SCOPE.waiter;
  if (!allowedStatuses.includes(status)) {
    throw createError("Vai tro hien tai khong duoc cap nhat trang thai nay", 403);
  }

  const transaction = await sequelize.transaction();
  let committed = false;
  let emitConfirmed = false;

  try {
    const order = await assertOrder(orderId, {
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    if (["completed", "cancelled"].includes(order.status)) {
      throw createError("Khong the cap nhat don hang da dong");
    }

    let finalOrderStatus = status;

    if (status === "confirmed") {
      await OrderItem.update(
        { status: "confirmed" },
        { where: { order_id: orderId, status: "pending" }, transaction },
      );
      finalOrderStatus = "confirmed";
      emitConfirmed = true;
    } else if (status === "preparing") {
      await OrderItem.update(
        { status: "preparing" },
        { where: { order_id: orderId, status: "confirmed" }, transaction },
      );
      finalOrderStatus = "preparing";
    } else if (status === "ready") {
      await OrderItem.update(
        { status: "ready" },
        { where: { order_id: orderId, status: "preparing" }, transaction },
      );

      const countNotReady = await OrderItem.count({
        where: {
          order_id: orderId,
          status: { [Op.notIn]: ["ready", "cancelled", "served"] },
        },
        transaction,
      });

      finalOrderStatus = countNotReady === 0 ? "ready" : order.status;
    } else if (status === "served") {
      await OrderItem.update(
        { status: "served" },
        { where: { order_id: orderId, status: "ready" }, transaction },
      );

      const countNotServed = await OrderItem.count({
        where: {
          order_id: orderId,
          status: { [Op.notIn]: ["served", "cancelled"] },
        },
        transaction,
      });

      finalOrderStatus = countNotServed === 0 ? "served" : order.status;
    } else if (status === "cancelled") {
      await OrderItem.update(
        { status: "cancelled", reject_reason: reason || null },
        { where: { order_id: orderId }, transaction },
      );
      finalOrderStatus = "cancelled";
    }

    order.status = finalOrderStatus;
    await order.save({ transaction });
    await transaction.commit();
    committed = true;

    const updatedOrder = await getFullOrder(orderId);
    emitOrderUpdate(io, updatedOrder);

    if (io && emitConfirmed) {
      io.emit("order_confirmed", updatedOrder);
    }

    return updatedOrder;
  } catch (error) {
    if (!committed) {
      await transaction.rollback();
    }
    throw error;
  }
};

export const confirmBill = async ({
  discountType,
  discountValue,
  io,
  note,
  orderId,
  taxAmount,
}) => {
  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const order = await assertOrder(orderId, {
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    if (["completed", "cancelled"].includes(order.status)) {
      throw createError("Khong the chot bill cho don hang da dong");
    }

    if (order.status !== "payment_request") {
      throw createError("Chi co the chot bill sau khi khach yeu cau thanh toan");
    }

    const items = await loadBillableItems(orderId, transaction);
    if (items.length === 0) {
      throw createError("Don hang khong co mon nao de thanh toan");
    }

    const unservedCount = items.filter((item) => item.status !== "served").length;
    if (unservedCount > 0) {
      throw createError(`Con ${unservedCount} mon chua duoc phuc vu`);
    }

    const calculatedSubtotal = calculateSubtotal(items);
    const parsedDiscountValue = Number(discountValue || 0);
    const tax = Number(taxAmount || 0);

    if (!Number.isFinite(parsedDiscountValue) || parsedDiscountValue < 0) {
      throw createError("Gia tri giam gia khong hop le");
    }

    if (!Number.isFinite(tax) || tax < 0) {
      throw createError("Tien thue khong hop le");
    }

    let discountAmount = 0;
    if (discountType === "percent") {
      if (parsedDiscountValue > 100) {
        throw createError("Giam gia phan tram khong duoc vuot qua 100");
      }
      discountAmount = (calculatedSubtotal * parsedDiscountValue) / 100;
    } else if (discountType === "fixed") {
      discountAmount = parsedDiscountValue;
    } else if (discountType) {
      throw createError("Loai giam gia khong hop le");
    }

    const finalTotal = Math.max(0, calculatedSubtotal + tax - discountAmount);

    order.subtotal = calculatedSubtotal;
    order.discount_type = discountType || null;
    order.discount_value = parsedDiscountValue;
    order.tax_amount = tax;
    order.total_amount = finalTotal;
    order.note = note || null;
    order.status = "payment_pending";
    await order.save({ transaction });

    await transaction.commit();
    committed = true;

    const fullOrder = await getFullOrder(orderId);
    emitOrderUpdate(io, fullOrder);
    if (io && fullOrder.table_id) {
      io.emit(`bill_confirmed_table_${fullOrder.table_id}`, fullOrder);
    }

    return fullOrder;
  } catch (error) {
    if (!committed) {
      await transaction.rollback();
    }
    throw error;
  }
};

export const markAsPaid = async ({ io, orderId, paymentMethod = "cash" }) => {
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw createError("Phuong thuc thanh toan khong hop le");
  }

  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const order = await assertOrder(orderId, {
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    if (order.status !== "payment_pending") {
      throw createError("Chi co the thanh toan don da duoc chot bill");
    }

    order.status = "completed";
    order.payment_method = paymentMethod;
    order.transaction_id = order.transaction_id || `${paymentMethod.toUpperCase()}_${Date.now()}`;
    order.completed_at = new Date();
    await order.save({ transaction });

    await transaction.commit();
    committed = true;

    const fullOrder = await getFullOrder(orderId);
    emitOrderUpdate(io, fullOrder);
    if (io) {
      io.emit("table_status_updated", {
        tableId: fullOrder.table_id,
        status: "available",
      });
      io.emit(`payment_success_table_${fullOrder.table_id}`, { orderId });
    }

    return fullOrder;
  } catch (error) {
    if (!committed) {
      await transaction.rollback();
    }
    throw error;
  }
};

export const rejectOrderItem = async ({ io, itemId, reason }) => {
  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const item = await OrderItem.findByPk(itemId, {
      include: [
        { model: MenuItem, as: "menu_item" },
        {
          model: OrderItemModifier,
          as: "modifiers",
          include: [{ model: ModifierOption, as: "modifier_option" }],
        },
      ],
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    if (!item) {
      throw createError("Khong tim thay mon", 404);
    }

    if (item.status === "cancelled") {
      throw createError("Mon nay da bi huy");
    }

    const order = await assertOrder(item.order_id, {
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    if (
      ["payment_request", "payment_pending", "completed", "cancelled"].includes(
        order.status,
      )
    ) {
      throw createError("Khong the huy mon sau khi da chot bill");
    }

    const itemTotal = calculateItemTotal(item);

    item.status = "cancelled";
    item.reject_reason = reason || null;
    await item.save({ transaction });

    order.subtotal = Math.max(0, Number(order.subtotal || 0) - itemTotal);
    order.total_amount = Math.max(0, Number(order.total_amount || 0) - itemTotal);
    await order.save({ transaction });

    await transaction.commit();
    committed = true;

    const updatedOrder = await getFullOrder(item.order_id);
    emitOrderUpdate(io, updatedOrder);

    return updatedOrder;
  } catch (error) {
    if (!committed) {
      await transaction.rollback();
    }
    throw error;
  }
};

export default {
  getAllOrders,
  updateOrderStatus,
  confirmBill,
  markAsPaid,
  rejectOrderItem,
};
