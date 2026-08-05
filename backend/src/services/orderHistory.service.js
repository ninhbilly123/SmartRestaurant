import Order from "../models/order.js";
import logger from "../config/logger.js";
import db from "../models/index.js";
import {
  createPricedOrderItem,
  createServiceError,
} from "./orderPricing.service.js";

const ORDER_DETAIL_INCLUDE = [
  {
    association: "table",
    attributes: ["id", "table_number"],
  },
  {
    association: "items",
    attributes: [
      "id",
      "quantity",
      "price_at_order",
      "notes",
      "status",
      "reject_reason",
    ],
    include: [
      {
        association: "menu_item",
        attributes: ["id", "name", "price"],
      },
      {
        association: "modifiers",
        include: ["modifier_option"],
      },
    ],
  },
];

const OrderService = {
  async createOrder({ customer_id, table_id, items, note }) {
    const transaction = await db.sequelize.transaction();
    let calculatedTotal = 0;

    try {
      if (!Array.isArray(items) || items.length === 0) {
        throw createServiceError("Danh sach mon an khong duoc rong");
      }

      const newOrder = await db.Order.create(
        {
          customer_id: customer_id || null,
          table_id,
          subtotal: 0,
          tax_amount: 0,
          total_amount: 0,
          note: note || null,
          status: "pending",
          ordered_at: new Date(),
        },
        { transaction },
      );

      for (const itemData of items) {
        const { lineTotal } = await createPricedOrderItem({
          itemData,
          orderId: newOrder.id,
          transaction,
        });

        calculatedTotal += lineTotal;
      }

      newOrder.subtotal = calculatedTotal;
      newOrder.total_amount = calculatedTotal;
      await newOrder.save({ transaction });

      await transaction.commit();
      logger.info(
        `Order created successfully ID: ${newOrder.id}. Total: ${calculatedTotal}`,
      );

      return this.getOrderById(customer_id, newOrder.id);
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }

      logger.error("Error creating full order:", error.message);
      throw error;
    }
  },

  async getCustomerOrder(customerId) {
    try {
      return Order.findAll({
        where: { customer_id: customerId },
        include: [
          {
            association: "table",
            attributes: ["id", "table_number"],
          },
        ],
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      logger.error("OrderService: Error getting orders:", error.message);
      throw error;
    }
  },

  async getOrderById(customerId, orderId) {
    try {
      const whereClause = customerId
        ? { customer_id: customerId, id: orderId }
        : { id: orderId };

      const order = await Order.findOne({
        where: whereClause,
        include: ORDER_DETAIL_INCLUDE,
      });

      if (!order) {
        throw createServiceError("Khong tim thay don hang", 404);
      }

      return order;
    } catch (error) {
      logger.error("OrderService: Error getting order details:", error.message);
      throw error;
    }
  },
};

export default OrderService;
