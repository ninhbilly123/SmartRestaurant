import React, { useMemo } from 'react';
import { Receipt, Clock, Utensils, BellRing, ChevronRight } from 'lucide-react';

const FloatingOrderButton = ({ order, onClick }) => {
  // Logic tính toán trạng thái (giống tracking bar nhưng gọn hơn)
  const statusInfo = useMemo(() => {
    if (!order) {
        return null;
    }

    const items = order.items || [];
    
    // 1. Có món đã xong -> Màu xanh lá (Quan trọng nhất)
    if (items.some(i => i.status === 'ready')) {
        return { 
            color: 'bg-green-600 text-white shadow-green-200', 
            icon: <BellRing size={20} className="animate-pulse" />,
            label: 'Món đã xong!' 
        };
    }
    // 2. Có món đang chờ duyệt -> Màu vàng
    if (items.some(i => i.status === 'pending')) {
        return { 
            color: 'bg-yellow-500 text-white shadow-yellow-200', 
            icon: <Clock size={20} />,
            label: 'Đang gửi...' 
        };
    }
    // 3. Có món đang nấu -> Màu xanh dương
    if (items.some(i => i.status === 'preparing')) {
        return { 
            color: 'bg-blue-600 text-white shadow-blue-200', 
            icon: <Utensils size={20} />,
            label: 'Bếp đang nấu' 
        };
    }
    // 4. Mặc định/Đã phục vụ -> Màu xám đậm
    return { 
        color: 'bg-gray-800 text-white shadow-gray-400', 
        icon: <Receipt size={20} />,
        label: 'Đơn của bạn' 
    };
  }, [order]);

  if (!order || !statusInfo) return null;

  return (
    <button 
      onClick={onClick}
      className={`fixed bottom-6 right-4 z-40 flex items-center gap-2 pl-3 pr-4 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 ${statusInfo.color}`}
    >
      {/* Icon trạng thái */}
      <div className="flex items-center justify-center">
        {statusInfo.icon}
      </div>

      {/* Text thông báo */}
      <div className="flex flex-col items-start mr-1">
        <span className="text-xs font-bold leading-none">{statusInfo.label}</span>
        <span className="text-[10px] opacity-80 leading-tight">
            {order.items?.length || 0} món • #{order.id?.toString().slice(-4)}
        </span>
      </div>

      <ChevronRight size={16} className="opacity-70" />
    </button>
  );
};

export default FloatingOrderButton;
