import { Op, QueryTypes } from "sequelize";
import db from "../models/index.js";

const { Order } = db;
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
  const normalizedLimit = Math.max(1, parseInt(limit, 10) || 5);

  const topItems = await sequelize.query(
    `
      SELECT
        oi.menu_item_id,
        COALESCE(mi.name, 'Mon da xoa') AS name,
        SUM(oi.quantity)::int AS total_quantity,
        SUM((oi.price_at_order + COALESCE(modifiers.modifiers_total, 0)) * oi.quantity)::numeric AS total_revenue
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      LEFT JOIN (
        SELECT order_item_id, SUM(price) AS modifiers_total
        FROM order_item_modifiers
        GROUP BY order_item_id
      ) modifiers ON modifiers.order_item_id = oi.id
      WHERE o.status = 'completed'
        AND o.created_at BETWEEN :from AND :to
        AND oi.status <> 'cancelled'
      GROUP BY oi.menu_item_id, mi.name
      ORDER BY total_quantity DESC
      LIMIT :limit
    `,
    {
      replacements: { from, to, limit: normalizedLimit },
      type: QueryTypes.SELECT,
    },
  );

  return topItems.map((item) => ({
    name: item.name,
    value: Number(item.total_quantity || 0),
    revenue: Number(item.total_revenue || 0),
  }));
};

export const getPeakHours = async () => {
  const rows = await sequelize.query(
    `
      SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS order_count
      FROM orders
      WHERE status <> 'cancelled'
      GROUP BY hour
    `,
    { type: QueryTypes.SELECT },
  );

  const hoursCount = Array(24).fill(0);
  rows.forEach((row) => {
    if (row.hour >= 0 && row.hour < 24) {
      hoursCount[row.hour] = Number(row.order_count || 0);
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
