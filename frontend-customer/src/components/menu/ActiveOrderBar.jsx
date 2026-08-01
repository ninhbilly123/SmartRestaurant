import React, { useMemo } from 'react';
import { DollarSign, List, Clock, Utensils, CheckCircle, BellRing } from 'lucide-react';

const ActiveOrderBar = ({ order, onViewOrder, onRequestBill }) => {
  // --- LOGIC THÔNG MINH: Tính toán trạng thái hiển thị dựa trên món ăn ---
  const displayInfo = useMemo(() => {
    if (!order) {
        return null;
    }

    const items = order.items || [];
    const orderStatus = order.status;

    // 1. Ưu tiên cao nhất: Có món đang chờ duyệt (Mới gọi thêm)
    // Dù đơn cũ đang nấu hay đang ăn, nếu có món mới pending thì phải báo khách biết
    const hasPending = items.some(i => i.status === 'pending');
    if (hasPending) {
        return {
            text: 'Đang gửi món mới...',
            subText: 'Vui lòng đợi nhân viên xác nhận',
            color: 'bg-yellow-500',
            icon: <Clock size={16} className="text-white" />
        };
    }

    // 2. Ưu tiên nhì: Có món đã xong (Ready) mà chưa bưng ra
    // Báo để khách háo hức hoặc nhắc nhân viên
    const hasReady = items.some(i => i.status === 'ready');
    if (hasReady) {
        return {
            text: 'Món đã sẵn sàng!',
            subText: 'Nhân viên đang mang ra...',
            color: 'bg-green-500 animate-pulse', // Nhấp nháy cho nổi
            icon: <BellRing size={16} className="text-white" />
        };
    }

    // 3. Fallback: Dựa vào trạng thái Order tổng
    switch (orderStatus) {
        case 'confirmed':
            return {
                text: 'Đã xác nhận',
                subText: 'Đang chờ bếp tiếp nhận',
                color: 'bg-orange-500',
                icon: <CheckCircle size={16} className="text-white" />
            };
        case 'preparing':
            return {
                text: 'Bếp đang nấu...',
                subText: 'Món ăn sẽ sớm được phục vụ',
                color: 'bg-blue-600',
                icon: <Utensils size={16} className="text-white" />
            };
        case 'served':
            return {
                text: 'Đã phục vụ',
                subText: 'Chúc quý khách ngon miệng',
                color: 'bg-green-600',
                icon: <DollarSign size={16} className="text-white" />
            };
        case 'payment':
            return {
                text: 'Đang chờ thanh toán',
                subText: 'Vui lòng đợi nhân viên',
                color: 'bg-purple-600',
                icon: <DollarSign size={16} className="text-white" />
            };
        case 'completed':
            return {
                text: 'Hoàn tất',
                subText: 'Cảm ơn quý khách',
                color: 'bg-gray-600',
                icon: <CheckCircle size={16} className="text-white" />
            };
        case 'cancelled':
            return {
                text: 'Đã hủy',
                subText: 'Đơn hàng đã bị hủy',
                color: 'bg-red-600',
                icon: <Clock size={16} className="text-white" />
            };
        default:
            return {
                text: 'Đang xử lý',
                subText: 'Vui lòng đợi...',
                color: 'bg-gray-500',
                icon: <Clock size={16} className="text-white" />
            };
    }
  }, [order]);

  if (!order || !displayInfo) return null;

  // Format tiền
  const totalAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount || 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-3 z-40 pb-safe transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between gap-3">
        
        {/* TRẠNG THÁI (Bên trái) */}
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
            {/* Icon tròn */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${displayInfo.color}`}>
                {displayInfo.icon}
            </div>
            
            {/* Text thông báo */}
            <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm text-gray-800 truncate">
                    {displayInfo.text}
                </span>
                <span className="text-[10px] text-gray-500 truncate">
                    {displayInfo.subText} • <span className="font-semibold text-orange-600">{totalAmount}</span>
                </span>
            </div>
        </div>

        {/* BUTTONS (Bên phải) */}
        <div className="flex gap-2 flex-shrink-0">
            {/* Nút Chi tiết */}
            <button 
                onClick={onViewOrder}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center w-16 transition-colors"
            >
                <List size={18} className="mb-0.5" />
                Chi tiết
            </button>
            
            {/* Nút Gọi Bill (Chỉ hiện khi chưa gọi thanh toán) */}
            {order.status !== 'payment' && order.status !== 'completed' && order.status !== 'cancelled' && (
                <button 
                    onClick={onRequestBill}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center w-16 shadow-lg shadow-orange-200 transition-colors"
                >
                    <DollarSign size={18} className="mb-0.5" />
                    Thanh toán
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default ActiveOrderBar;
