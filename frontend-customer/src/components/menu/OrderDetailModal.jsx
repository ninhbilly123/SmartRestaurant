import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Receipt,
  Utensils,
  CheckCircle,
  BellRing,
  AlertCircle,
  CreditCard,
  Star,
  ChevronLeft,
  Loader,
  Check,
  MessageSquare,
} from "lucide-react";
import customerService from "../../services/customerService";

const OrderDetailModal = ({ order, onClose, onRequestBill }) => {
  // State quản lý review
  const [reviewingItem, setReviewingItem] = useState(null);

  // State Form Review
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State check reviewable
  const [reviewableItemIds, setReviewableItemIds] = useState(new Set());
  const [checkingReviewStatus, setCheckingReviewStatus] = useState(false);

  // --- 1. LOGIC CHECK TRẠNG THÁI REVIEW ---
  useEffect(() => {
    if (order && order.status === "completed") {
      checkReviewableStatus();
    }
  }, [order]);

  const checkReviewableStatus = async () => {
    setCheckingReviewStatus(true);
    try {
      const res = await customerService.getReviewableItems(order.id);
      const data = Array.isArray(res) ? res : res.data || [];
      const ids = new Set(data.map((item) => item.id || item.menu_item_id));
      setReviewableItemIds(ids);
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái review:", error);
    } finally {
      setCheckingReviewStatus(false);
    }
  };

  if (!order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  // --- 2. XỬ LÝ REVIEW ---
  const handleOpenReview = (item) => {
    setReviewingItem(item);
    setRating(5);
    setComment("");
  };

  const handleCloseReview = () => {
    setReviewingItem(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewingItem) return;

    setIsSubmitting(true);
    try {
      await customerService.createReview({
        menu_item_id:
          reviewingItem.menu_item?.id ||
          reviewingItem.menu_item_id ||
          reviewingItem.id,
        order_id: order.id,
        rating: rating,
        comment: comment,
      });

      setReviewableItemIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reviewingItem.id);
        newSet.delete(reviewingItem.menu_item?.id);
        return newSet;
      });

      alert("Cảm ơn đánh giá của bạn!");
      handleCloseReview();
    } catch (error) {
      alert(error.message || "Không thể gửi đánh giá, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. [UPDATE] HELPERS HIỂN THỊ STATUS MỚI ---
  const getOrderStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          text: "Chờ xác nhận",
          color: "bg-yellow-100 text-yellow-800",
          icon: <Clock size={16} />,
        };
      case "confirmed":
        return {
          text: "Đã xác nhận",
          color: "bg-orange-100 text-orange-800",
          icon: <CheckCircle size={16} />,
        };
      case "preparing":
        return {
          text: "Bếp đang nấu",
          color: "bg-blue-100 text-blue-800",
          icon: <Utensils size={16} />,
        };
      case "ready":
        return {
          text: "Món đã xong",
          color: "bg-green-100 text-green-800 animate-pulse",
          icon: <BellRing size={16} />,
        };
      case "served":
        return {
          text: "Đã phục vụ",
          color: "bg-teal-100 text-teal-800",
          icon: <CheckCircle size={16} />,
        };

      // [MỚI] Status thanh toán 2 bước
      case "payment_request":
        return {
          text: "Đợi nhân viên",
          color: "bg-purple-100 text-purple-800 animate-pulse",
          icon: <Clock size={16} />,
        };
      case "payment_pending":
        return {
          text: "Chờ thanh toán",
          color: "bg-pink-100 text-pink-800 font-bold",
          icon: <CreditCard size={16} />,
        };

      case "completed":
        return {
          text: "Hoàn tất",
          color: "bg-gray-200 text-gray-800",
          icon: <CheckCircle size={16} />,
        };
      case "cancelled":
        return {
          text: "Đã hủy",
          color: "bg-red-100 text-red-800",
          icon: <AlertCircle size={16} />,
        };
      default:
        return {
          text: status,
          color: "bg-gray-100 text-gray-800",
          icon: <Clock size={16} />,
        };
    }
  };

  const getItemStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200">
            Chờ duyệt
          </span>
        );
      case "confirmed":
        return (
          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
            Đã nhận
          </span>
        );
      case "preparing":
        return (
          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
            Đang nấu
          </span>
        );
      case "ready":
        return (
          <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-bold flex items-center gap-1">
            <BellRing size={10} /> Xong
          </span>
        );
      case "served":
        return (
          <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">
            Đã lên
          </span>
        );
      case "cancelled":
        return (
          <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100">
            Hết/Hủy
          </span>
        );
      default:
        return null;
    }
  };

  const orderStatusInfo = getOrderStatusInfo(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* TRƯỜNG HỢP 1: FORM REVIEW (Giữ nguyên) */}
        {reviewingItem ? (
          <div className="flex flex-col h-full animate-fade-in bg-gray-50">
            <div className="bg-white p-4 border-b flex items-center justify-between shadow-sm z-10">
              <button
                onClick={handleCloseReview}
                className="flex items-center text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg"
              >
                <ChevronLeft size={18} className="mr-1" /> Quay lại
              </button>
              <h3 className="font-bold text-gray-800 text-lg">
                Đánh giá món ăn
              </h3>
              <div className="w-16"></div>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                  <img
                    src={
                      reviewingItem.menu_item?.image ||
                      reviewingItem.image ||
                      "https://placehold.co/100?text=Food"
                    }
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900 leading-tight mb-1">
                    {reviewingItem.menu_item?.name || reviewingItem.name}
                  </h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Utensils size={12} /> Bạn thấy món này thế nào?
                  </p>
                </div>
              </div>
              <form onSubmit={handleSubmitReview}>
                <div className="flex flex-col items-center gap-2 mb-8">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110 focus:outline-none p-1"
                      >
                        <Star
                          size={40}
                          className={`${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 mt-2">
                    {rating === 5
                      ? "Tuyệt vời! 😍"
                      : rating === 4
                        ? "Rất ngon! 😋"
                        : rating === 3
                          ? "Tạm ổn 🙂"
                          : rating === 2
                            ? "Cần cải thiện 😐"
                            : "Tệ quá 😞"}
                  </span>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <MessageSquare size={16} /> Bình luận thêm{" "}
                    <span className="font-normal text-gray-400">
                      (Tùy chọn)
                    </span>
                  </label>
                  <textarea
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    rows="4"
                    placeholder="Hương vị, độ nóng..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader className="animate-spin" size={20} />
                  ) : (
                    "Gửi đánh giá"
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* TRƯỜNG HỢP 2: HIỂN THỊ CHI TIẾT (UPDATE) */
          <>
            {/* HEADER */}
            <div className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                  <Receipt size={20} className="text-orange-600" /> Chi tiết đơn
                  hàng
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mã đơn:{" "}
                  <span className="font-mono font-bold text-gray-700">
                    #{order.id?.toString().slice(-6).toUpperCase()}
                  </span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* BODY */}
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50/50">
              {/* Trạng thái chung */}
              <div
                className={`mb-5 flex justify-between items-center p-3 rounded-xl border border-dashed ${orderStatusInfo.color.replace("text-", "border-").replace("800", "200")}`}
              >
                <span className="text-sm font-bold flex items-center gap-2">
                  {orderStatusInfo.icon} Trạng thái chung:{" "}
                </span>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${orderStatusInfo.color}`}
                >
                  {orderStatusInfo.text}
                </span>
              </div>

              {/* Danh sách món */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Danh sách món ăn
                </h4>
                {order.items?.map((item, index) => {
                  const canReview =
                    reviewableItemIds.has(item.id) ||
                    reviewableItemIds.has(item.menu_item?.id);
                  const isCancelled = item.status === "cancelled";
                  return (
                    <div
                      key={index}
                      className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3 relative overflow-hidden"
                    >
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${item.status === "cancelled" ? "bg-red-400" : item.status === "pending" ? "bg-yellow-400" : item.status === "preparing" ? "bg-blue-500" : item.status === "ready" ? "bg-green-500" : "bg-gray-300"}`}
                      ></div>
                      <div className="flex flex-col justify-start pt-0.5 pl-2">
                        <span className="w-7 h-7 flex items-center justify-center bg-gray-100 text-gray-800 text-xs font-bold rounded-lg">
                          {item.quantity}x
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h4
                            className={`font-bold text-sm text-gray-800 ${isCancelled ? "line-through text-gray-400" : ""}`}
                          >
                            {item.menu_item?.name || item.name}
                          </h4>
                          <span className="text-xs text-gray-500 font-medium">
                            {formatCurrency(
                              item.price_at_order || item.menu_item?.price || 0,
                            )}
                          </span>
                        </div>
                        {item.modifiers?.length > 0 && (
                          <div className="text-[11px] text-gray-500 mt-1 space-y-0.5">
                            {item.modifiers.map((mod, idx) => {
                              // 🔥 Logic lấy giá chuẩn (giống BillModal)
                              const modPrice = parseFloat(
                                mod.price ||
                                  mod.price_adjustment ||
                                  mod.modifier_option?.price_adjustment ||
                                  0,
                              );

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2"
                                >
                                  <span>
                                    + {mod.modifier_option?.name || mod.name}
                                  </span>
                                  {/* Chỉ hiện giá nếu > 0 */}
                                  {modPrice > 0 && (
                                    <span className="font-medium text-gray-700">
                                      {formatCurrency(modPrice)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {item.notes && (
                          <div className="mt-1.5">
                            <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded italic">
                              Ghi chú: {item.notes}
                            </span>
                          </div>
                        )}

                        {/* Hiển thị lý do từ chối nếu item bị cancelled */}
                        {isCancelled && item.reject_reason && (
                          <div className="mt-1.5">
                            <span className="text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 flex items-center gap-1">
                              <AlertCircle size={10} /> Lý do:{" "}
                              {item.reject_reason}
                            </span>
                          </div>
                        )}

                        {/* REVIEW BUTTON */}
                        {order.status === "completed" && !isCancelled && (
                          <div className="mt-3 pt-2 border-t border-dashed border-gray-100 flex justify-end">
                            {checkingReviewStatus ? (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Loader size={10} className="animate-spin" />{" "}
                                Kiểm tra...
                              </span>
                            ) : canReview ? (
                              <button
                                onClick={() => handleOpenReview(item)}
                                className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 shadow-sm"
                              >
                                <Star size={12} className="fill-green-700" />{" "}
                                Viết đánh giá
                              </button>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 select-none">
                                <Check size={12} /> Đã đánh giá
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-between items-end pl-2">
                        <div className="flex-shrink-0">
                          {getItemStatusBadge(item.status)}
                        </div>
                        <p className="font-bold text-sm text-gray-900">
                          {formatCurrency(
                            (parseFloat(
                              item.price_at_order || item.menu_item?.price || 0,
                            ) +
                              (item.modifiers || []).reduce(
                                (s, m) =>
                                  s +
                                  parseFloat(
                                    m.price ||
                                      m.price_adjustment ||
                                      m.modifier_option?.price_adjustment ||
                                      0,
                                  ),
                                0,
                              )) *
                              item.quantity,
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FOOTER [UPDATE LOGIC] */}
            <div className="p-4 bg-white border-t space-y-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
              {/* Hiển thị breakdown nếu order đã có subtotal > 0 (tức waiter đã chốt bill) */}
              {order.subtotal > 0 ? (
                <>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Tạm tính</span>

                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>

                  {order.discount_value > 0 && (
                    <div className="flex justify-between items-center text-sm text-red-600">
                      <span>
                        Giảm giá
                        {order.discount_type === "percent" &&
                          ` (${order.discount_value}%)`}
                      </span>
                      <span>
                        -
                        {formatCurrency(
                          order.discount_type === "percent"
                            ? (order.subtotal * order.discount_value) / 100
                            : order.discount_value,
                        )}
                      </span>
                    </div>
                  )}

                  {order.tax_amount > 0 && (
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Thuế</span>
                      <span>+{formatCurrency(order.tax_amount)}</span>
                    </div>
                  )}

                  {/* Hiển thị phương thức thanh toán nếu đã chọn */}
                  {order.payment_method && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Phương thức thanh toán
                      </span>
                      <span className="font-bold text-blue-600">
                        {order.payment_method === "cash" && "💵 Tiền mặt"}
                        {order.payment_method === "momo" && "🟣 MoMo"}
                        {order.payment_method === "vnpay" && "🔵 VNPay"}
                        {!["cash", "momo", "vnpay"].includes(
                          order.payment_method,
                        ) && order.payment_method}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xl font-bold text-gray-900 pt-2 border-t border-dashed">
                    <span>Tổng cộng</span>
                    <span className="text-orange-600">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </>
              ) : (
                // Nếu chưa chốt bill, chỉ hiển thị tổng tạm tính
                <>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Tạm tính</span>
                    <span>
                      {formatCurrency(order.totalAmount || order.total_amount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span className="text-orange-600">
                      {formatCurrency(order.totalAmount || order.total_amount)}
                    </span>
                  </div>
                </>
              )}

              {/* LOGIC NÚT BẤM CẬP NHẬT */}
              {onRequestBill && (
                <>
                  {/* 1. Đang chờ nhân viên (payment_request) */}
                  {order.status === "payment_request" && (
                    <button
                      disabled
                      className="w-full py-3.5 bg-purple-100 text-purple-700 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Clock size={20} className="animate-spin" /> Đang đợi nhân
                      viên xác nhận...
                    </button>
                  )}

                  {/* 2. Đã có bill, chờ khách trả (payment_pending) */}
                  {order.status === "payment_pending" && (
                    <button
                      onClick={onRequestBill}
                      className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-lg transition-all animate-pulse flex items-center justify-center gap-2"
                    >
                      <CreditCard size={20} /> Thanh toán ngay
                    </button>
                  )}

                  {/* 3. Chưa gọi thanh toán (pending/served) */}
                  {![
                    "payment_request",
                    "payment_pending",
                    "completed",
                    "cancelled",
                  ].includes(order.status) && (
                    <button
                      onClick={onRequestBill}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <CreditCard size={20} /> Yêu cầu thanh toán
                    </button>
                  )}
                </>
              )}

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors active:scale-[0.98]"
              >
                Đóng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetailModal;
