// controllers/restaurant/order.controller.js
import db from '../../models/index.js';
import { Op } from 'sequelize';
import logger from '../../config/logger.js';
const { Order, OrderItem, OrderItemModifier, MenuItem, ModifierOption, Table } = db;

// GET: /api/admin/orders
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: {
                status: {
                    // Lấy tất cả ngoại trừ đơn đã xong (completed) và đã hủy (cancelled)
                    [Op.notIn]: ['completed', 'cancelled'] 
                }
            },
            include: [
                { 
                    model: Table, 
                    as: 'table',
                    attributes: ['id', 'table_number'] 
                },
                { 
                    model: OrderItem, 
                    as: 'items',
                    include: [
                        { 
                            model: MenuItem, 
                            as: 'menu_item', // Lưu ý: Alias phải khớp với model OrderItem (bạn đang để là 'menu_item')
                            attributes: ['name', 'price'] 
                        },
                        // 👇 MỚI: Lấy thêm Modifier để hiển thị (VD: Ít đường, Cay nhiều)
                        {
                            model: OrderItemModifier,
                            as: 'modifiers',
                            include: [
                                {
                                    model: ModifierOption,
                                    as: 'modifier_option',
                                    attributes: ['name', 'price_adjustment']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']] 
        });

        return res.status(200).json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.error('Get All Orders Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT: /api/admin/orders/:orderId/status
export const updateOrderStatus = async (req, res) => {
    try {
        // Route có thể dùng :id hoặc :orderId, support cả 2
        const orderId = req.params.orderId || req.params.id;
        const { status } = req.body;
        
        logger.info('updateOrderStatus called:', { orderId, status });

        // 1. Tìm đơn hàng
        const order = await Order.findByPk(orderId);
        if (!order) {
            logger.warn('Order not found:', orderId);
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }
        
        logger.info('Order found:', { id: order.id, currentStatus: order.status });

        // ==================================================================
        // 2. XỬ LÝ LOGIC TRẠNG THÁI (CORE LOGIC)
        // ==================================================================

        // Biến lưu trạng thái cuối cùng của Order (Mặc định là status gửi lên)
        let finalOrderStatus = status; 

        // ------------------------------------------------------------------
        // CASE A: WAITER DUYỆT ĐƠN (Confirmed)
        // ------------------------------------------------------------------
        if (status === 'confirmed') {
            await OrderItem.update(
                { status: 'confirmed' }, 
                { where: { order_id: orderId, status: 'pending' } }
            );
            // Waiter đã duyệt hết pending -> Order chắc chắn là confirmed
            finalOrderStatus = 'confirmed';
        }

        // ------------------------------------------------------------------
        // CASE B: BẾP NHẬN NẤU (Preparing) -> [LOGIC BẠN HỎI NẰM Ở ĐÂY]
        // ------------------------------------------------------------------
        else if (status === 'preparing') {
            // Bước 1: Chỉ chuyển những món Waiter ĐÃ DUYỆT (confirmed) sang preparing
            await OrderItem.update(
                { status: 'preparing' }, 
                { where: { order_id: orderId, status: 'confirmed' } }
            );
            finalOrderStatus = 'preparing';
        } 

        // ------------------------------------------------------------------
        // CASE C: BẾP BÁO XONG (Ready)
        // ------------------------------------------------------------------
        else if (status === 'ready') {
            await OrderItem.update(
                { status: 'ready' }, 
                { where: { order_id: orderId, status: 'preparing' } }
            );

            // 2. [LOGIC BẠN YÊU CẦU] Kiểm tra xem TẤT CẢ món đã ready chưa?
            const countNotReady = await OrderItem.count({
                where: { 
                    order_id: orderId, 
                    status: { [Op.notIn]: ['ready', 'cancelled', 'served'] }
                    // (Có thể loại trừ món cancelled nếu muốn)
                }
            });

            if (countNotReady === 0) {
                // Nếu không còn món nào chưa xong -> Vỏ Order mới được thành Ready
                finalOrderStatus = 'ready';
            } else {
                // Nếu vẫn còn món đang nấu/chờ -> Giữ nguyên trạng thái cũ (ví dụ Preparing)
                // Bếp chỉ update status từng món lẻ thôi.
                logger.info("Chưa xong hết các món, không update Order Status");
                finalOrderStatus = order.status; // Giữ nguyên
            }
 
        }

        // [BỔ SUNG] CASE D: WAITER BƯNG MÓN (Served)
        // ------------------------------------------------------------------
        else if (status === 'served') {
            // Bước 1: Chỉ chuyển những món đang READY sang SERVED
            // (Món đang nấu 'preparing' hay đang chờ 'pending' thì KHÔNG được bưng)
            await OrderItem.update(
                { status: 'served' }, 
                { 
                    where: { 
                        order_id: orderId, 
                        status: 'ready' // Chỉ tác động vào món đã xong
                    } 
                }
            );

            // Bước 2: Kiểm tra xem ĐƠN HÀNG đã sạch bách chưa?
            // Đếm số lượng món CHƯA được phục vụ (Khác 'served' và khác 'cancelled')
            const countNotServed = await OrderItem.count({
                where: { 
                    order_id: orderId, 
                    status: { [Op.notIn]: ['served', 'cancelled'] } 
                }
            });

            // Bước 3: Quyết định trạng thái Order (Vỏ)
            if (countNotServed === 0) {
                // Nếu không còn món nào chưa bưng -> Order chính thức thành SERVED
                finalOrderStatus = 'served';
            } else {
                // Nếu vẫn còn món (đang nấu, đang chờ, hoặc đang ready mà chưa kịp bưng hết)
                // -> Giữ nguyên trạng thái cũ của Order (thường là 'ready' hoặc 'preparing')
                logger.info("Vẫn còn món chưa phục vụ hết -> Order status giữ nguyên.");
                finalOrderStatus = order.status; 
            }
        }

        // ------------------------------------------------------------------
        // CASE D: HỦY ĐƠN (Cancelled)
        // ------------------------------------------------------------------
        else if (status === 'cancelled') {
            const { reason } = req.body;
            await OrderItem.update(
                { status: 'cancelled' }, 
                { where: { order_id: orderId } }
            );
            finalOrderStatus = 'cancelled';
        }
        else if (status === 'payment_request') {
             finalOrderStatus = 'payment_request';
        }

        // 3. LƯU TRẠNG THÁI ORDER (VỎ)
        // Dùng biến finalOrderStatus đã tính toán ở trên thay vì status gốc
        order.status = finalOrderStatus;
        await order.save();


        // 4. RELOAD & SOCKET (Giữ nguyên không đổi)
        const updatedOrder = await Order.findByPk(orderId, {
            include: [
                { model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menu_item' }, { model: OrderItemModifier, as: 'modifiers', include: [{ model: ModifierOption, as: 'modifier_option' }] }] },
                { model: Table, as: 'table' }
            ]
        });

        if (updatedOrder.table_id) {
            req.io.emit(`order_update_table_${updatedOrder.table_id}`, updatedOrder);
        }
        req.io.emit('order_status_updated', updatedOrder);
        
        if (finalOrderStatus === 'confirmed') {
             req.io.emit('order_confirmed', updatedOrder);
        }

        return res.status(200).json({ success: true, data: updatedOrder });

    } catch (error) {
        console.error('Update Order Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

export const confirmBill = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { discount_type, discount_value, tax_amount, note } = req.body;

        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // 1. TÍNH LẠI SUBTOTAL (Để đảm bảo chính xác tuyệt đối từ Server)
        const items = await OrderItem.findAll({ 
            where: { order_id: orderId, status: { [Op.not]: 'cancelled' } },
            include: [
                { model: MenuItem, as: 'menu_item', attributes: ['price'] },
                { model: OrderItemModifier, as: 'modifiers', include: [{model: ModifierOption, as: 'modifier_option', attributes: ['price_adjustment']}] }
            ]
        });
        
        let calculatedSubtotal = 0;
        items.forEach(item => {
            let itemPrice = parseFloat(item.menu_item?.price || 0);
            // Cộng tiền Topping/Modifier
            if(item.modifiers && item.modifiers.length > 0) {
                item.modifiers.forEach(mod => {
                    itemPrice += parseFloat(mod.modifier_option?.price_adjustment || 0);
                });
            }
            calculatedSubtotal += (itemPrice * item.quantity);
        });

        // 2. Áp dụng Giảm giá
        let discountAmount = 0;
        const dValue = parseFloat(discount_value || 0);
        
        if (discount_type === 'percent') {
            discountAmount = (calculatedSubtotal * dValue) / 100;
        } else if (discount_type === 'fixed') {
            discountAmount = dValue;
        }

        // 3. Tính Tổng cuối
        const tax = parseFloat(tax_amount || 0);
        const finalTotal = calculatedSubtotal + tax - discountAmount;

        // 4. Update DB & Chuyển trạng thái sang 'payment_pending'
        order.subtotal = calculatedSubtotal;
        order.discount_type = discount_type;
        order.discount_value = dValue;
        order.tax_amount = tax;
        order.total_amount = finalTotal > 0 ? finalTotal : 0;
        order.note = note;
        order.status = 'payment_pending'; 
        
        await order.save();

        // 5. Socket thông báo
        if (req.io) {
            const fullOrder = await Order.findByPk(orderId, {
                include: [
                    { model: Table, as: 'table' },
                    { 
                        model: OrderItem, 
                        as: 'items',
                        include: [
                            { model: MenuItem, as: 'menu_item' },
                            { 
                                model: OrderItemModifier, 
                                as: 'modifiers',
                                include: [{ model: ModifierOption, as: 'modifier_option' }]
                            }
                        ]
                    }
                ]
            });
            
            req.io.emit('order_status_updated', fullOrder);
            // Bắn event riêng để App khách hiện nút thanh toán
            req.io.emit(`bill_confirmed_table_${order.table_id}`, fullOrder);
        }

        return res.json({ success: true, message: 'Đã gửi hóa đơn cho khách', data: order });

    } catch (error) {
        console.error("Confirm Bill Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const markAsPaid = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { payment_method } = req.body; 

        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // 1. Cập nhật Order
        order.status = 'completed';
        order.payment_method = payment_method || 'cash';
        order.completed_at = new Date();
        await order.save();

        // // 2. Giải phóng bàn
        // if (order.table_id) {
        //     await Table.update({ status: 'available' }, { where: { id: order.table_id } });
        // }

        // 3. Socket thông báo
        if (req.io) {
            req.io.emit('order_status_updated', order);
            req.io.emit('table_status_updated', { tableId: order.table_id, status: 'available' });
            req.io.emit(`payment_success_table_${order.table_id}`, { orderId });
        }

        return res.json({ success: true, message: 'Thanh toán thành công' });

    } catch (error) {
        console.error("Mark Paid Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT: /api/admin/orders/items/:itemId/reject
export const rejectOrderItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { reason } = req.body; 

        // 1. Tìm món ăn
        const item = await OrderItem.findByPk(itemId, {
            include: [
                { model: MenuItem, as: 'menu_item' },
                { 
                    model: OrderItemModifier, 
                    as: 'modifiers',
                    include: [{ model: ModifierOption, as: 'modifier_option' }]
                }
            ]
        });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy món' });
        }

        // 2. Lấy order để check status
        const order = await Order.findByPk(item.order_id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        // 3. OPTION A: Chỉ cho reject trước khi confirm bill
        if (order.status === 'payment_pending' || order.status === 'completed') {
            return res.status(400).json({ 
                success: false, 
                message: 'Không thể hủy món sau khi đã chốt bill' 
            });
        }

        // 4. Tính giá item cần trừ (base price + modifiers)
        const basePrice = parseFloat(item.price_at_order || item.menu_item?.price || 0);
        const modifiersTotal = (item.modifiers || []).reduce((sum, mod) => {
            return sum + parseFloat(
                mod.price || 
                mod.modifier_option?.price_adjustment || 
                0
            );
        }, 0);
        const itemTotal = (basePrice + modifiersTotal) * item.quantity;

        // 5. Trừ giá item khỏi total_amount
        order.total_amount = Math.max(0, (order.total_amount || 0) - itemTotal);
        await order.save();

        // 6. Cập nhật trạng thái item
        item.status = 'cancelled';
        item.reject_reason = reason;
        await item.save();

        // 7. Lấy lại Order đầy đủ để bắn Socket
        const updatedOrder = await Order.findByPk(item.order_id, {
            include: [
                { 
                    model: OrderItem, as: 'items',
                    include: [
                        { model: MenuItem, as: 'menu_item' }, 
                        { 
                            model: OrderItemModifier, 
                            as: 'modifiers', 
                            include: [{ model: ModifierOption, as: 'modifier_option' }]
                        }
                    ]
                },
                { model: Table, as: 'table' }
            ]
        });

        // 8. Bắn Socket cập nhật UI cho tất cả (Waiter & Kitchen)
        if (req.io) {
            req.io.emit('order_status_updated', updatedOrder);
            if (updatedOrder.table_id) {
                req.io.emit(`order_update_table_${updatedOrder.table_id}`, updatedOrder);
            }
        }

        return res.json({ success: true, message: 'Đã từ chối món', data: updatedOrder });

    } catch (error) {
        console.error("Reject Item Error:", error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
