// src/controllers/restaurant/kitchen.controller.js
import db from "../../models/index.js";
import { Op } from "sequelize";
import logger from "../../config/logger.js";
const { Order, OrderItem, Table, MenuItem, OrderItemModifier, ModifierOption, Sequelize } = db;


// 1. Lấy danh sách orders cho Kitchen Display
export const getKitchenOrders = async (req, res) => {
  try {
    const { status } = req.query;

    // Mặc định lấy các đơn chưa hoàn thành
    let whereCondition = {
      status: ["pending", "confirmed", "preparing", "ready"],
    };

    if (status) {
      whereCondition.status = status.split(",");
    }

    const orders = await Order.findAll({
      where: whereCondition,
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
              status: {
                  [Op.ne]: 'cancelled' // Lấy tất cả TRỪ món đã hủy
              }
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

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("[Kitchen Controller] getKitchenOrders Error:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách đơn hàng",
      message: error.message,
    });
  }
};


// 3. Lấy thống kê cho Kitchen Display
export const getKitchenStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, preparing, ready, completedToday] = await Promise.all([
      // Pending bao gồm cả confirmed (đã duyệt chờ nấu)
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

    return res.status(200).json({
      success: true,
      data: {
        pending,
        preparing,
        ready,
        completedToday,
      },
    });
  } catch (error) {
    console.error("[Kitchen Controller] getKitchenStats Error:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi khi lấy thống kê",
      message: error.message,
    });
  }
};

// [MỚI] Hàm cập nhật trạng thái TỪNG MÓN
export const updateOrderItemStatus = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { status } = req.body; // 'ready'

        const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
        if (!validStatuses.includes(status)) {
             return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        

        // 1. Update món ăn
        const item = await OrderItem.findByPk(itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        // 🛡️ 3. [BỔ SUNG QUAN TRỌNG] Chặn sửa nếu đơn đã Đóng/Hủy
        // Tránh việc Bếp bấm nghịch vào đơn đã thanh toán xong
        const parentOrder = await Order.findByPk(item.order_id);
        if (['completed', 'cancelled'].includes(parentOrder.status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Đơn hàng đã đóng hoặc bị hủy. Không thể cập nhật món.' 
            });
        }
        
        item.status = status;
        await item.save();

        // 2. Logic Tự động cập nhật trạng thái Order cha
        const order = await Order.findByPk(item.order_id, {
            include: [{ model: OrderItem, as: 'items' }, { model: Table, as: 'table' }]
        });

        if (order) {
            const validItems = order.items.filter(i => i.status !== 'cancelled');

            const allItemsDone = validItems.every(i => ['ready', 'served'].includes(i.status));
            // Nếu có ít nhất 1 món đang 'preparing' hoặc 'ready' -> Order phải là 'preparing'
            const hasPreparingItem = validItems.some(i => i.status === 'preparing');

            // CASE A: Tất cả đã xong -> Lên đời 'ready'
            // (Chỉ lên khi Order chưa đóng và chưa ready)
            if (allItemsDone && !['ready', 'served', 'completed'].includes(order.status)) {
                logger.info(`Order ${order.id} tự động chuyển sang READY`);
                order.status = 'ready';
                await order.save();
            }
            // CASE B: Nếu chưa xong hết
            else if (!allItemsDone) {
                // Tình huống 1: Đang 'ready' mà bị lùi lại (do bấm nhầm/thêm món)
                // Tình huống 2: Đang 'confirmed'/'pending' mà Bếp bắt đầu nấu món đầu tiên (QUAN TRỌNG)
                if (order.status === 'ready' || (hasPreparingItem && ['pending', 'confirmed'].includes(order.status))) {
                     logger.info(`Order ${order.id} cập nhật trạng thái PREPARING`);
                     order.status = 'preparing';
                     await order.save();
                }
            }
        }

        // 3. Lấy lại dữ liệu đầy đủ để bắn Socket
        const fullOrder = await Order.findByPk(item.order_id, {
             include: [
                { model: Table, as: 'table' },
                { 
                    model: OrderItem, as: 'items',
                    include: [
                        { model: MenuItem, as: 'menu_item' },
                        { model: OrderItemModifier, as: 'modifiers', include: ['modifier_option'] }
                    ]
                }
            ]
        });

        // 4. Bắn Socket
        if (req.io) {
            req.io.emit('order_status_updated', fullOrder);
            if (fullOrder.table) {
                req.io.emit(`order_update_table_${fullOrder.table.id}`, fullOrder);
            }
        }

        return res.json({ success: true, data: fullOrder });

    } catch (error) {
        console.error("Update Item Error:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
