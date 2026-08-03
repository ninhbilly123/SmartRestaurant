import { Op } from "sequelize";
import db from "../models/index.js";

const { Order, OrderItem, MenuItem } = db;
const sequelize = db.sequelize;

const getDateRange = ({ fromDate, toDate, fallbackDays }) => {
  const to = toDate ? new Date(toDate) : new Date();
  const from = fromDate
    ? new Date(fromDate)
    : new Date(Date.now() - fallbackDays * 24 * 60 * 60 * 1000);

  return [from, to];
};

export const getDashboardStats = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [revenueToday, ordersToday, activeTables] = await Promise.all([
    Order.sum("total_amount", {
      where: {
        created_at: { [Op.between]: [startOfDay, endOfDay] },
        status: "completed",
      },
    }),
    Order.count({
      where: {
        created_at: { [Op.between]: [startOfDay, endOfDay] },
        status: { [Op.ne]: "cancelled" },
      },
    }),
    Order.count({
      distinct: true,
      col: "table_id",
      where: {
        status: {
          [Op.in]: [
            "pending",
            "confirmed",
            "preparing",
            "ready",
            "served",
            "payment_request",
            "payment_pending",
          ],
        },
      },
    }),
  ]);

  return {
    revenue: revenueToday || 0,
    orders: ordersToday || 0,
    activeTables: activeTables || 0,
  };
};

export const getRevenueChart = async ({ fromDate, toDate }) => {
  const [from, to] = getDateRange({ fromDate, toDate, fallbackDays: 7 });

  return Order.findAll({
    attributes: [
      [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
      [sequelize.fn("SUM", sequelize.col("total_amount")), "revenue"],
    ],
    where: {
      status: "completed",
      created_at: { [Op.between]: [from, to] },
    },
    group: [sequelize.fn("DATE", sequelize.col("created_at"))],
    order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
    raw: true,
  });
};

export const getTopSellingItems = async ({ fromDate, toDate, limit = 5 }) => {
  const [from, to] = getDateRange({ fromDate, toDate, fallbackDays: 30 });

  const topItems = await OrderItem.findAll({
    attributes: [
      "menu_item_id",
      [sequelize.fn("SUM", sequelize.col("quantity")), "total_quantity"],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal("quantity * price_at_order"),
        ),
        "total_revenue",
      ],
    ],
    include: [
      {
        model: MenuItem,
        as: "menu_item",
        attributes: ["name"],
      },
      {
        model: Order,
        as: "order",
        attributes: [],
        where: {
          status: "completed",
          created_at: { [Op.between]: [from, to] },
        },
      },
    ],
    group: ["menu_item_id", "menu_item.id"],
    order: [[sequelize.literal("total_quantity"), "DESC"]],
    limit: parseInt(limit, 10),
    raw: true,
    nest: true,
  });

  return topItems.map((item) => ({
    name: item.menu_item?.name || "Mon da xoa",
    value: parseInt(item.total_quantity, 10),
    revenue: parseFloat(item.total_revenue),
  }));
};

export const getPeakHours = async () => {
  const orders = await Order.findAll({
    attributes: ["created_at"],
    where: {
      status: { [Op.ne]: "cancelled" },
    },
    raw: true,
  });

  const hoursCount = Array(24).fill(0);

  orders.forEach((order) => {
    if (!order.created_at) return;

    const hour = new Date(order.created_at).getHours();
    if (hour >= 0 && hour < 24) {
      hoursCount[hour] += 1;
    }
  });

  return hoursCount.map((count, hour) => ({
    hour,
    order_count: count,
  }));
};

export default {
  getDashboardStats,
  getRevenueChart,
  getTopSellingItems,
  getPeakHours,
};
