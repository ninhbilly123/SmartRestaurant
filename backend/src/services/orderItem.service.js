// services/orderItem.service.js
import db from '../models/index.js'; // Import từ db chung
import logger from '../config/logger.js';

class OrderItemService {
  /**
   * Tạo mới một chi tiết đơn hàng
   */
  async createOrderItems(data) {
    const { order_id, items } = data;

    // 1. Transaction bao trùm toàn bộ
    const transaction = await db.sequelize.transaction();
    
    // 👇 Biến để tính tổng tiền của đợt gọi món này
    let batchTotalAmount = 0; 

    try {
      // Duyệt qua từng món trong mảng gửi lên
      for (const itemData of items) {
        // Lưu ý: itemData lúc này backend nhận được key là 'menu_item_id' (do Frontend map)
        // hoặc 'id' tùy vào payload bạn gửi.
        // Để an toàn, mình destructure linh hoạt:
        const menu_item_id = itemData.menu_item_id || itemData.id; 
        const { quantity, notes, modifiers } = itemData;

        // A. Tra giá gốc (Security)
        const menuItem = await db.MenuItem.findByPk(menu_item_id);
        if (!menuItem) {
          throw new Error(`Món ăn ID ${menu_item_id} không tồn tại`);
        }

        const itemPrice = Number(menuItem.price); // Giá gốc món ăn
        let itemModifiersTotal = 0; // Tổng tiền topping của riêng món này

        // B. Tạo OrderItem
        const newItem = await db.OrderItem.create({
          order_id,
          menu_item_id,
          quantity: quantity || 1,
          price_at_order: itemPrice, // Giá gốc từ DB
          notes: notes || null,
          status: 'pending'
        }, { transaction });

        // C. Lưu Modifiers (Snapshot Pricing)
        if (modifiers && Array.isArray(modifiers) && modifiers.length > 0) {
          const modifierRecords = modifiers.map((modifier) => {
             // Lấy giá snapshot
             const modPrice = Number(modifier.price_adjustment || modifier.price || 0);
             
             // Cộng dồn vào tổng tiền topping
             itemModifiersTotal += modPrice; 

             return {
                order_item_id: newItem.id,
                modifier_option_id: modifier.optionId || modifier.id,
                price: modPrice
             };
          });

          await db.OrderItemModifier.bulkCreate(modifierRecords, { transaction });
        }

        // D. 👇 [QUAN TRỌNG] Cộng tiền món này vào tổng batch
        // Công thức: (Giá món + Giá Topping) * Số lượng
        batchTotalAmount += (itemPrice + itemModifiersTotal) * (quantity || 1);
      }

      // E. 👇 [MỚI] Cập nhật lại tổng tiền cho Order
      const currentOrder = await db.Order.findByPk(order_id, { transaction });
      if (!currentOrder) throw new Error('Order not found during update');

      // Cộng tiền cũ + Tiền mới gọi thêm
      currentOrder.total_amount = Number(currentOrder.total_amount) + batchTotalAmount;
      await currentOrder.save({ transaction });

      // 2. Commit Transaction
      await transaction.commit();
      
      logger.info(`Added items. Batch total: ${batchTotalAmount}. New Order Total: ${currentOrder.total_amount}`);

      return true; 

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Lấy danh sách món ăn theo Order ID và format dữ liệu
   */
  async getItemsByOrderId(orderId) {
    // Dùng db.OrderItem
    const items = await db.OrderItem.findAll({
      where: { order_id: orderId },
      include: [
        {
          model: db.MenuItem,
          as: "menu_item", // [QUAN TRỌNG] Giữ là 'menu_item' (snake_case) như đã fix ở index.js
          attributes: ["name", "price", "image"],
        },
        {
          model: db.OrderItemModifier,
          as: "modifiers",
          attributes: ['id', 'price', 'modifier_option_id'],
          include: [
            {
              model: db.ModifierOption,
              as: "modifier_option",
              attributes: ["name"]
            }
          ]
        }
      ],
    });

    return items.map((item) => {
      const price = parseFloat(item.price_at_order) || 0;
      const qty = parseInt(item.quantity) || 0;
      
      // Tính tổng tiền bao gồm cả modifier (dùng giá snapshot)
      const modifiersTotal = (item.modifiers || []).reduce((sum, mod) => {
          return sum + parseFloat(mod.price || 0);
      }, 0);

      return {
        id: item.id,
        menu_item_id: item.menu_item_id,
        menu_item_name: item.menu_item?.name || "Món đã xóa",
        menu_item_image: item.menu_item?.image,
        
        price_at_order: price, // Giá gốc
        quantity: qty,
        
        // List modifiers kèm giá
        modifiers: item.modifiers.map(m => ({
            id: m.id,
            name: m.modifier_option?.name,
            price: parseFloat(m.price) // Giá snapshot
        })),

        // Tổng tiền dòng này = (Giá gốc + Topping) * SL
        subtotal: (price + modifiersTotal) * qty,
        notes: item.notes || "",
        status: item.status
      };
    });
  }
}

export default new OrderItemService();
