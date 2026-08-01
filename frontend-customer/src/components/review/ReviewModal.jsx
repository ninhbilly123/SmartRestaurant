import React, { useState } from 'react';
import { Star, X, Loader, Send } from 'lucide-react';
import Swal from "sweetalert2";
import CustomerService from '../../services/customerService';
import { getCustomerInfo } from '../../utils/customerAuth';

const ReviewModal = ({ isOpen, onClose, menuItem, orderId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  // Lấy tên khách từ auth storage hoặc để trống
  const [customerName, setCustomerName] = useState(
    getCustomerInfo()?.full_name || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !menuItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      Swal.fire("Chưa chọn sao", "Vui lòng chọn số sao đánh giá", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      // Gọi API trực tiếp tại đây để đảm bảo logic
      const response = await CustomerService.createReview({
        menu_item_id: menuItem.id, // hoặc menuItem.menu_item_id tùy structure
        order_id: orderId,
        rating,
        comment,
        customer_name: customerName || 'Khách hàng ẩn danh'
      });

      if (response.success) {
        Swal.fire({
             icon: "success",
             title: "Đánh giá thành công!",
             text: "Cảm ơn đóng góp của bạn.",
             timer: 1500,
             showConfirmButton: false
        });
        
        // Reset form
        setRating(0);
        setComment('');
        
        // Callback báo cho cha biết (để reload list review hoặc update UI)
        if (onSuccess) onSuccess();
        
        onClose();
      }
    } catch (error) {
      console.error('Submit review error:', error);
      Swal.fire("Lỗi", error.message || "Không thể gửi đánh giá", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Đánh giá món ăn</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Menu Item Info */}
          <div className="flex items-center gap-4 mb-6 p-3 bg-orange-50 rounded-xl border border-orange-100">
            {menuItem.image && (
                <img src={menuItem.image} alt={menuItem.name} className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div>
                 <h3 className="font-bold text-gray-900 line-clamp-1">{menuItem.name}</h3>
                 <p className="text-sm font-semibold text-orange-600">{formatPrice(menuItem.price)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Star Rating */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-600 mb-2">Bạn cảm thấy món này thế nào?</label>
              <div className="flex justify-center gap-2 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      size={32}
                      className={`${
                        star <= (hoveredRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="h-6 text-sm font-bold text-orange-500">
                  {rating === 5 && 'Tuyệt vời! 😍'}
                  {rating === 4 && 'Rất ngon 😋'}
                  {rating === 3 && 'Tạm ổn 🙂'}
                  {rating === 2 && 'Không ngon lắm 😕'}
                  {rating === 1 && 'Tệ quá 😞'}
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tên hiển thị (Tùy chọn)</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                placeholder="Ví dụ: Anh Nam"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nhận xét</label>
              <textarea
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 min-h-[100px] resize-none"
                placeholder="Hãy chia sẻ thêm về trải nghiệm của bạn..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
              />
              <div className="text-right text-xs text-gray-400 mt-1">{comment.length}/500</div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="flex-[2] py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
                Gửi đánh giá
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
