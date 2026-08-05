import { Op, Transaction } from "sequelize";
import db from "../models/index.js";

const {
  Order,
  OrderItem,
  Table,
  MenuItem,
  OrderItemModifier,
  ModifierOption,
  sequelize,
} = db;

const KITCHEN_ORDER_STATUSES = ["pending", "confirmed", "preparing", "ready"];
const ORDER_ITEM_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "cancelled",
];

const FULL_ORDER_INCLUDE = [
  { model: Table, as: "table" },
  {
    model: OrderItem,
    as: "items",
    include: [
      { model: MenuItem, as: "menu_item" },
      {
        model: OrderItemModifier,
        as: "modifiers",
        include: ["modifier_option"],
      },
    ],
  },
];

const emitOrderUpdate = (io, order) => {
  if (!io || !order) return;

  io.emit("order_status_updated", order);
  if (order.table) {
    io.emit(`order_update_table_${order.table.id}`, order);
  }
};

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const getFullOrder = (orderId) =>
  Order.findByPk(orderId, {
    include: FULL_ORDER_INCLUDE,
  });

const resolveParentOrderStatus = (currentStatus, items) => {
  const activeItems = (items || []).filter(
    (item) => item.status !== "cancelled",
  );

  if (activeItems.length === 0) {
    return currentStatus;
  }

  const allServed = activeItems.every((item) => item.status === "served");
  if (allServed) return "served";

  const allReadyOrServed = activeItems.every((item) =>
    ["ready", "served"].includes(item.status),
  );
  if (allReadyOrServed) return "ready";

  const hasPreparing = activeItems.some((item) => item.status === "preparing");
  if (hasPreparing) return "preparing";

  const hasConfirmed = activeItems.some((item) => item.status === "confirmed");
  if (hasConfirmed) return "confirmed";

  return "pending";
};

export const getKitchenOrders = async ({ status } = {}) => {
  const statuses = status ? status.split(",") : KITCHEN_ORDER_STATUSES;

  return Order.findAll({
    where: {
      status: { [Op.in]: statuses },
    },
    include: [
      {
        model: Table,
        as: "table",
        attributes: ["id", "table_number", "location"],
      },
      {
        model: OrderItem,
        as: "items",
        where: {
          status: { [Op.ne]: "cancelled" },
        },
        required: true,
        include: [
          {
            model: MenuItem,
            as: "menu_item",
            attributes: ["id", "name", "prep_time_minutes"],
          },
          {
            model: OrderItemModifier,
            as: "modifiers",
            include: [
              {
                model: ModifierOption,
                as: "modifier_option",
                attributes: ["id", "name", "price_adjustment"],
              },
            ],
          },
        ],
      },
    ],
    order: [["ordered_at", "ASC"]],
  });
};

export const getKitchenStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pending, preparing, ready, completedToday] = await Promise.all([
    Order.count({ where: { status: { [Op.in]: ["pending", "confirmed"] } } }),
    Order.count({ where: { status: "preparing" } }),
    Order.count({ where: { status: "ready" } }),
    Order.count({
      where: {
        status: { [Op.in]: ["completed", "served"] },
        completed_at: { [Op.gte]: today },
      },
    }),
  ]);

  return {
    pending,
    preparing,
    ready,
    completedToday,
  };
};

export const updateOrderItemStatus = async ({ itemId, status, io }) => {
  if (!ORDER_ITEM_STATUSES.includes(status)) {
    throw createError("Trang thai mon khong hop le");
  }

  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const item = await OrderItem.findByPk(itemId, {
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    if (!item) {
      throw createError("Item not found", 404);
    }

    const order = await Order.findByPk(item.order_id, {
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    if (!order) {
      throw createError("Order not found", 404);
    }

    const items = await OrderItem.findAll({
      where: { order_id: order.id },
      transaction,
    });

    if (
      ["completed", "cancelled", "payment_request", "payment_pending"].includes(
        order.status,
      )
    ) {
      throw createError("Don hang da dong hoac da chot bill, khong the cap nhat mon");
    }

    item.status = status;
    await item.save({ transaction });

    const updatedItems = items.map((orderItem) =>
      orderItem.id === item.id ? item : orderItem,
    );
    order.status = resolveParentOrderStatus(order.status, updatedItems);
    await order.save({ transaction });

    await transaction.commit();
    committed = true;

    const fullOrder = await getFullOrder(order.id);
    emitOrderUpdate(io, fullOrder);
    return fullOrder;
  } catch (error) {
    if (!committed) {
      await transaction.rollback();
    }
    throw error;
  }
};

export default {
  getKitchenOrders,
  getKitchenStats,
  updateOrderItemStatus,
};
