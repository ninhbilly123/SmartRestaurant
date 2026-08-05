import { Transaction } from "sequelize";
import logger from "../config/logger.js";
import db from "../models/index.js";
import {
  CLOSED_ORDER_STATUSES,
  createPricedOrderItem,
  createServiceError,
} from "./orderPricing.service.js";

class OrderItemService {
  async createOrderItems(data) {
    const { order_id: orderId, items } = data;
    const transaction = await db.sequelize.transaction();

    try {
      const order = await db.Order.findByPk(orderId, {
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });

      if (!order) {
        throw createServiceError("Order khong ton tai", 404);
      }

      if (CLOSED_ORDER_STATUSES.includes(order.status)) {
        throw createServiceError("Don hang da dong, khong the goi them mon");
      }

      const createdItems = [];
      let batchTotalAmount = 0;

      for (const itemData of items) {
        const { orderItem, lineTotal } = await createPricedOrderItem({
          itemData,
          orderId,
          transaction,
        });

        batchTotalAmount += lineTotal;
        createdItems.push(orderItem);
      }

      order.subtotal = Number(order.subtotal || 0) + batchTotalAmount;
      order.total_amount = Number(order.total_amount || 0) + batchTotalAmount;
      if (["ready", "served"].includes(order.status)) {
        order.status = "pending";
      }
      await order.save({ transaction });

      await transaction.commit();

      logger.info(
        `Added ${createdItems.length} order items. Batch total: ${batchTotalAmount}. Order: ${orderId}`,
      );

      return createdItems;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getItemsByOrderId(orderId) {
    const items = await db.OrderItem.findAll({
      where: { order_id: orderId },
      include: [
        {
          model: db.MenuItem,
          as: "menu_item",
          attributes: ["id", "name", "price"],
          include: [
            {
              model: db.MenuItemPhoto,
              as: "photos",
              attributes: ["id", "url", "is_primary"],
              required: false,
            },
          ],
        },
        {
          model: db.OrderItemModifier,
          as: "modifiers",
          attributes: ["id", "price", "modifier_option_id"],
          include: [
            {
              model: db.ModifierOption,
              as: "modifier_option",
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    return items.map((item) => {
      const price = Number(item.price_at_order || 0);
      const quantity = Number(item.quantity || 0);
      const modifiers = item.modifiers || [];
      const modifiersTotal = modifiers.reduce(
        (sum, modifier) => sum + Number(modifier.price || 0),
        0,
      );
      const photos = item.menu_item?.photos || [];
      const primaryPhoto =
        photos.find((photo) => photo.is_primary) || photos[0] || null;

      return {
        id: item.id,
        menu_item_id: item.menu_item_id,
        menu_item_name: item.menu_item?.name || "Mon da xoa",
        menu_item_image: primaryPhoto?.url || null,
        price_at_order: price,
        quantity,
        modifiers: modifiers.map((modifier) => ({
          id: modifier.id,
          name: modifier.modifier_option?.name,
          price: Number(modifier.price || 0),
        })),
        subtotal: (price + modifiersTotal) * quantity,
        notes: item.notes || "",
        status: item.status,
      };
    });
  }
}

export default new OrderItemService();
