import React, { useState, useMemo } from "react";
import {
  X,
  Receipt,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader,
  Clock,
  Banknote,
} from "lucide-react";
import Swal from "sweetalert2";
import CustomerService from "../../services/customerService";

const BillModal = ({ isOpen, onClose, order, onRequestPayment }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");

  // --- 1. CONFIG PAYMENT METHODS ---
  const paymentMethods = [
    {
      id: "cash",
      name: "Tiền mặt",
      icon: <Banknote size={24} />,
      activeClass: "border-green-500 bg-green-50 text-green-700",
    },
    {
      id: "momo",
      name: "MoMo",
      icon: "🟣", // Hoặc icon SVG
      activeClass: "border-pink-500 bg-pink-50 text-pink-700",
    },
    {
      id: "vnpay",
      name: "VNPay",
      icon: "🔵",
      activeClass: "border-blue-500 bg-blue-50 text-blue-700",
    },
  ];

  // --- 2. LOGIC TRẠNG THÁI (QUAN TRỌNG) ---
  const isPendingStaff = order?.status === "payment_request"; // Đang chờ Waiter confirm
  const isReadyToPay = order?.status === "payment_pending"; // Waiter đã chốt, chờ Khách trả
  const isPaid = order?.status === "completed";

  // Kiểm tra món đã lên hết chưa
  const allItemsServed = useMemo(() => {
    if (!order) return false;
    const items = order.items || [];
    if (items.length === 0) return false;
    const activeItems = items.filter((i) => i.status !== "cancelled");
    if (activeItems.length === 0) return false;
    return activeItems.every((i) => i.status === "served");
  }, [order]);

  if (!isOpen || !order) return null;

  // --- 3. FORMATTER ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- 4. TÍNH TOÁN HIỂN THỊ ---
  // Nếu Waiter đã chốt (payment_pending), dùng số liệu từ DB (order.subtotal, order.tax...)
  // Nếu chưa, tạm tính ở Client để khách tham khảo

  const clientSubtotal = (order.items || []).reduce((sum, item) => {
    if (item.status === "cancelled") return sum;

    // 1. Lấy giá gốc món ăn (Ưu tiên giá snapshot nếu backend đã sửa chuẩn)
    // Nếu backend chưa sửa, nó fallback về menu_item.price (giá hiện tại)
    const basePrice = parseFloat(
      item.price_at_order || item.menu_item?.price || 0,
    );

    // 2. Cộng giá modifier
    const modifierPrice = (item.modifiers || []).reduce((modSum, mod) => {
      // 👇 QUAN TRỌNG: Thêm check mod.price đầu tiên
      const currentModPrice = parseFloat(
        mod.price || // 1. Giá Snapshot (Cột mới)
          mod.price_adjustment || // 2. Giá cấu hình (Cũ)
          mod.modifier_option?.price_adjustment || // 3. Fallback sâu hơn
          0,
      );
      return modSum + currentModPrice;
    }, 0);

    return sum + (basePrice + modifierPrice) * item.quantity;
  }, 0);

  // Dữ liệu hiển thị cuối cùng
  const displayData = {
    subtotal: isReadyToPay ? order.subtotal : clientSubtotal,
    tax: isReadyToPay ? order.tax_amount : 0,
    discount: isReadyToPay
      ? order.discount_type === "percent"
        ? (order.subtotal * order.discount_value) / 100
        : order.discount_value
      : 0,
    total: isReadyToPay ? order.total_amount : clientSubtotal, // Tạm tính chưa thuế phí nếu chưa chốt
  };

  // --- 5. HANDLERS ---

  const handleConfirmAction = async () => {
    // A. Nếu chưa gọi thanh toán -> Gọi API request (Step 1)
    // (Trường hợp khách mở bill thủ công xem trước khi Waiter chốt)
    if (!isPendingStaff && !isReadyToPay) {
      if (!allItemsServed) {
        Swal.fire("Chưa thể thanh toán", "Vui lòng đợi món lên đủ!", "warning");
        return;
      }
      // Gọi hàm từ props (MenuPage sẽ gọi API requestPayment - KHÔNG CẦN payment_method)
      onRequestPayment(order.id);
      return;
    }

    // B. Nếu đang chờ Waiter -> Không làm gì (Nút disabled rồi)
    if (isPendingStaff) return;

    // C. Nếu đã chốt bill (Ready To Pay) -> Xử lý thanh toán (Step 3)
    if (isReadyToPay) {
      setIsProcessing(true);
      try {
        // 1. Gọi API lưu phương thức thanh toán vào DB
        await CustomerService.selectPaymentMethod(order.id, selectedPaymentMethod);
        
        // 2. Xử lý theo từng phương thức
        if (selectedPaymentMethod === "cash") {
          // Tiền mặt: Hiện thông báo, waiter sẽ thu tiền
          Swal.fire({
            icon: "info",
            title: "Thanh toán Tiền mặt",
            text: "Vui lòng chuẩn bị tiền mặt. Nhân viên sẽ đến thu tại bàn.",
            confirmButtonColor: "#16a34a",
          });
          onClose();
        } else if (selectedPaymentMethod === "momo") {
          // MoMo: Tạo payment link và redirect
          const res = await CustomerService.createMomoPayment(order.id);
          if (res && res.payUrl) {
            window.location.href = res.payUrl;
          } else {
            throw new Error("Không lấy được link thanh toán");
          }
        } else if (selectedPaymentMethod === "vnpay") {
          // VNPay: Tương tự MoMo
          Swal.fire("Thông báo", "Cổng thanh toán VNPay đang bảo trì.", "info");
        } else {
          // Các cổng khác
          Swal.fire("Thông báo", "Cổng thanh toán này đang bảo trì.", "info");
        }
      } catch (err) {
        Swal.fire("Lỗi", err.message || "Không thể xử lý thanh toán", "error");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
              <Receipt size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                Hóa đơn bàn {order.table?.table_number}
              </h2>
              <p className="text-xs text-orange-100 opacity-90">
                #{order.id?.slice(-6).toUpperCase()} •{" "}
                {formatDateTime(order.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* BODY - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {/* BANNER TRẠNG THÁI */}
          {isPendingStaff && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex items-center gap-3 animate-pulse">
              <Clock size={24} />
              <div className="text-sm">
                <p className="font-bold">Đang chờ nhân viên xác nhận...</p>
                <p>Vui lòng đợi nhân viên mang hóa đơn đến.</p>
              </div>
            </div>
          )}

          {/* LIST MÓN */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
              Chi tiết món ăn
            </div>
            <div className="p-4 space-y-3">
              {(order.items || []).map((item, idx) => {
                if (item.status === "cancelled") return null;
                const itemPrice = parseFloat(
                  item.menu_item?.price || item.price_at_order || 0,
                );
                // Tính giá modifier để hiển thị đúng
                const modPrice = (item.modifiers || []).reduce(
                  (s, m) =>
                    s +
                    parseFloat(
                      m.price || m.modifier_option?.price_adjustment || 0,
                    ),
                  0,
                );

                return (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <span className="font-bold text-gray-900 mr-2">
                        {item.quantity}x
                      </span>
                      <span className="text-gray-700">
                        {item.menu_item?.name}
                      </span>
                      <span className="text-xs text-gray-500 font-medium ml-2">
                        {formatCurrency(itemPrice)}
                      </span>
                      {item.modifiers?.length > 0 && (
                        <div className="text-xs text-gray-500 pl-6 mt-1 space-y-0.5">
                          {item.modifiers.map((m, idx) => {
                            // Lấy giá topping (ưu tiên giá snapshot)
                            const price = parseFloat(
                              m.price ||
                                m.modifier_option?.price_adjustment ||
                                0,
                            );

                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <span>+ {m.modifier_option?.name || "Topping"}</span>
                                {price > 0 && (
                                  <span className="font-medium text-gray-700">
                                    {formatCurrency(price)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <span className="font-medium">
                      {formatCurrency((itemPrice + modPrice) * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* TỔNG KẾT TIỀN */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Tạm tính</span>
                <span>{formatCurrency(displayData.subtotal)}</span>
              </div>

              {/* Chỉ hiện Discount/Tax khi đã Ready (Waiter đã nhập) */}
              {isReadyToPay && (
                <>
                  {parseFloat(displayData.discount) > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>
                        Giảm giá (
                        {order.discount_type === "percent"
                          ? `${order.discount_value}%`
                          : "Tiền mặt"}
                        )
                      </span>
                      <span>-{formatCurrency(displayData.discount)}</span>
                    </div>
                  )}
                  {parseFloat(displayData.tax) > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>
                        Thuế (VAT/Service)
                        {isReadyToPay && order.subtotal > 0 && 
                          ` (${((displayData.tax / (displayData.subtotal - displayData.discount)) * 100).toFixed(1)}%)`
                        }
                      </span>
                      <span>+{formatCurrency(displayData.tax)}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                <span className="font-bold text-gray-800 text-lg">
                  TỔNG THANH TOÁN
                </span>
                <span className="text-xl font-bold text-orange-600">
                  {formatCurrency(displayData.total)}
                </span>
              </div>
              {/* Ghi chú từ Waiter */}
              {isReadyToPay && order.note && (
                <div className="text-xs text-gray-400 italic text-right">
                  Note: {order.note}
                </div>
              )}
            </div>
          </div>

          {/* CHỌN PHƯƠNG THỨC (Chỉ hiện khi Ready) */}
          {isReadyToPay && !isPaid && (
            <div>
              <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">
                Phương thức thanh toán
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    disabled={isProcessing}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 relative ${
                      selectedPaymentMethod === method.id
                        ? method.activeClass
                        : "border-gray-100 bg-white hover:border-gray-200 text-gray-500"
                    }`}
                  >
                    {selectedPaymentMethod === method.id && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle size={14} />
                      </div>
                    )}
                    <div className="text-2xl">{method.icon}</div>
                    <div className="text-sm font-bold">{method.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="p-5 bg-white border-t border-gray-100 shrink-0">
          {/* Logic hiển thị nút bấm */}
          {!isPendingStaff && !isReadyToPay && (
            <button
              onClick={handleConfirmAction}
              disabled={!allItemsServed}
              className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
                !allItemsServed
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {allItemsServed ? "Gọi Thanh Toán" : "Đợi món lên đủ..."}
            </button>
          )}

          {isPendingStaff && (
            <button
              disabled
              className="w-full py-3.5 rounded-xl font-bold text-gray-500 bg-gray-200 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Loader size={20} className="animate-spin" /> Đang chờ xác nhận...
            </button>
          )}

          {isReadyToPay && (
            <button
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <Loader className="animate-spin" />
              ) : selectedPaymentMethod === "cash" ? (
                <Banknote />
              ) : (
                <CreditCard />
              )}
              {selectedPaymentMethod === "cash"
                ? "Xác nhận trả Tiền mặt"
                : "Thanh toán ngay"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillModal;
