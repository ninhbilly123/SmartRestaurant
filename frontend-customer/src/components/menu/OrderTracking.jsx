import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import {
  CheckCircle,
  Clock,
  ChefHat,
  DollarSign,
  ArrowLeft,
  CreditCard,
  Loader,
} from "lucide-react";
import Swal from "sweetalert2";
import CustomerService from "../../services/customerService";
import { savePaymentSession } from "../../utils/tableSession";

// URL Socket lấy từ env
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const OrderTracking = ({ orderId, onOrderMore, tableId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const socketRef = useRef();

  // 1. Lấy dữ liệu đơn hàng & Kết nối Socket
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await CustomerService.getOrderById(orderId);
        if (res.success) setOrder(res.data);
      } catch (err) {
        console.error("Lỗi lấy đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();

    socketRef.current = io(SOCKET_URL);

    // Lắng nghe sự kiện update từ server (tên event phải khớp với Backend)
    socketRef.current.on(`order_update_${orderId}`, (updatedOrder) => {
      setOrder(updatedOrder);
    });

    return () => socketRef.current.disconnect();
  }, [orderId]);

  const handleRequestPayment = async () => {
    // Kiểm tra tất cả món đã served chưa
    const activeItems = (order?.items || []).filter(
      (i) => i.status !== "cancelled",
    );
    const allServed =
      activeItems.length > 0 && activeItems.every((i) => i.status === "served");

    if (!allServed) {
      Swal.fire(
        "Chưa thể thanh toán",
        "Vui lòng đợi tất cả món được phục vụ.",
        "warning",
      );
      return;
    }

    // Hiển thị modal chọn phương thức thanh toán
    setShowPaymentOptions(true);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);

    try {
      // Gửi yêu cầu thanh toán với phương thức đã chọn
      await CustomerService.requestPayment(orderId, selectedPaymentMethod);

      if (selectedPaymentMethod === "cash") {
        // Tiền mặt: Thông báo và đợi nhân viên
        setShowPaymentOptions(false);
        Swal.fire({
          title: "Đã gửi yêu cầu!",
          text: "Vui lòng đợi nhân viên đến thu tiền.",
          icon: "success",
          confirmButtonColor: "#7e22ce",
        });
      } else if (selectedPaymentMethod === "momo") {
        // MoMo: Gọi API tạo thanh toán và redirect
        try {
          // Lưu thông tin bàn để redirect về sau
          savePaymentSession(tableId, orderId);

          const momoResponse = await CustomerService.createMomoPayment(
            orderId,
            order.totalAmount,
          );

          if (momoResponse && momoResponse.payUrl) {
            // Redirect đến MoMo
            window.location.href = momoResponse.payUrl;
          } else {
            throw new Error(
              momoResponse?.message || "Không thể tạo thanh toán MoMo",
            );
          }
        } catch (momoError) {
          console.error("MoMo payment error:", momoError);
          Swal.fire(
            "Lỗi",
            "Không thể tạo thanh toán MoMo: " + momoError.message,
            "error",
          );
        }
      } else {
        // Các phương thức khác (mock)
        setShowPaymentOptions(false);
        Swal.fire({
          title: "Đang xử lý...",
          text: `Chuyển đến cổng thanh toán ${selectedPaymentMethod.toUpperCase()}`,
          icon: "info",
          timer: 2000,
          showConfirmButton: false,
        });

        // Mock complete payment
        setTimeout(async () => {
          try {
            await CustomerService.completePayment(
              orderId,
              `${selectedPaymentMethod.toUpperCase()}_${Date.now()}`,
              selectedPaymentMethod,
            );
            Swal.fire("Thành công!", "Thanh toán hoàn tất.", "success");
          } catch {
            Swal.fire("Lỗi", "Không thể hoàn tất thanh toán.", "error");
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Payment request error:", err);
      Swal.fire(
        "Lỗi",
        "Không gửi được yêu cầu thanh toán: " + err.message,
        "error",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: "cash",
      name: "Tiền mặt",
      icon: "💵",
      description: "Nhân viên sẽ đến thu tiền",
    },
    {
      id: "momo",
      name: "MoMo",
      icon: "🟣",
      description: "Thanh toán qua ví MoMo",
    },
    {
      id: "vnpay",
      name: "VNPay",
      icon: "🔵",
      description: "Cổng thanh toán VNPay",
    },
    {
      id: "zalopay",
      name: "ZaloPay",
      icon: "🔷",
      description: "Thanh toán qua ZaloPay",
    },
  ];

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const renderItemStatus = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="text-yellow-600 bg-yellow-100 text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Clock size={12} /> Chờ duyệt
          </span>
        );
      case "preparing":
        return (
          <span className="text-blue-600 bg-blue-100 text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <ChefHat size={12} /> Đang nấu
          </span>
        );
      case "served":
        return (
          <span className="text-green-600 bg-green-100 text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle size={12} /> Đã ra món
          </span>
        );
      default:
        return <span className="text-gray-500 text-xs">{status}</span>;
    }
  };

  if (loading)
    return <div className="text-center p-10">Đang tải hóa đơn...</div>;
  if (!order)
    return <div className="text-center p-10">Không tìm thấy đơn hàng</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between">
        <button
          onClick={onOrderMore}
          className="flex items-center text-blue-600 font-medium"
        >
          <ArrowLeft size={20} className="mr-1" /> Gọi thêm món
        </button>
        <div className="text-right">
          <p className="text-xs text-gray-500">Đơn hàng</p>
          <p className="font-bold text-gray-800">
            #{orderId.toString().slice(-6).toUpperCase()}
          </p>
        </div>
      </div>

      {/* List Món Ăn */}
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-bold text-lg mb-3 border-b pb-2">
            Danh sách món
          </h3>
          {order.items?.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-start py-3 border-b border-dashed last:border-0"
            >
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-800">
                    {item.quantity}x {item.name || item.menuItem?.name}
                  </span>
                  <span className="text-gray-600">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-xs text-gray-400 italic mt-1">
                    Ghi chú: {item.notes}
                  </p>
                )}
                <div className="mt-2">{renderItemStatus(item.status)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tổng tiền */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Tổng tạm tính:</span>
            <span className="text-orange-600">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3">
        <button
          onClick={onOrderMore}
          className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
        >
          + Gọi thêm
        </button>
        <button
          onClick={handleRequestPayment}
          className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 flex justify-center items-center gap-2"
        >
          <DollarSign size={20} /> Thanh toán
        </button>
      </div>

      {/* Payment Method Modal */}
      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CreditCard size={24} /> Chọn phương thức thanh toán
              </h3>
              <button
                onClick={() => setShowPaymentOptions(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  disabled={isProcessing}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    selectedPaymentMethod === method.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="text-3xl">{method.icon}</span>
                  <div className="text-left">
                    <div className="font-bold text-gray-800">{method.name}</div>
                    <div className="text-sm text-gray-500">
                      {method.description}
                    </div>
                  </div>
                  {selectedPaymentMethod === method.id && (
                    <CheckCircle
                      size={24}
                      className="ml-auto text-purple-600"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Tổng thanh toán:</span>
                <span className="text-purple-600">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                isProcessing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Xác nhận thanh toán
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
