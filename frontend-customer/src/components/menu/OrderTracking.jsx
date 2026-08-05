import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  ArrowLeft,
  Banknote,
  CheckCircle,
  ChefHat,
  Clock,
  CreditCard,
  DollarSign,
  Loader,
} from "lucide-react";
import Swal from "sweetalert2";
import CustomerService from "../../services/customerService";
import { savePaymentSession } from "../../utils/tableSession";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const PAYMENT_METHODS = [
  {
    id: "cash",
    name: "Tiền mặt",
    description: "Nhân viên sẽ đến thu tiền tại bàn",
    icon: Banknote,
  },
  {
    id: "momo",
    name: "MoMo",
    description: "Thanh toán qua ví MoMo sau khi nhân viên chốt hóa đơn",
    icon: CreditCard,
  },
  {
    id: "vnpay",
    name: "VNPay",
    description: "Cổng thanh toán đang bảo trì",
    icon: CreditCard,
    disabled: true,
  },
  {
    id: "zalopay",
    name: "ZaloPay",
    description: "Cổng thanh toán đang bảo trì",
    icon: CreditCard,
    disabled: true,
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);

const getOrderTotal = (order) => order?.total_amount || order?.totalAmount || 0;

const OrderTracking = ({ orderId, onOrderMore, tableId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const socketRef = useRef();

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
    socketRef.current.on(`order_update_${orderId}`, setOrder);

    if (tableId) {
      socketRef.current.on(`order_update_table_${tableId}`, (updatedOrder) => {
        if (updatedOrder?.id === orderId) setOrder(updatedOrder);
      });
    }

    return () => socketRef.current?.disconnect();
  }, [orderId, tableId]);

  const activeItems = useMemo(
    () => (order?.items || []).filter((item) => item.status !== "cancelled"),
    [order],
  );

  const allServed = useMemo(
    () =>
      activeItems.length > 0 &&
      activeItems.every((item) => item.status === "served"),
    [activeItems],
  );

  const handleRequestPayment = () => {
    if (!allServed) {
      Swal.fire(
        "Chưa thể thanh toán",
        "Vui lòng đợi tất cả món được phục vụ.",
        "warning",
      );
      return;
    }

    setShowPaymentOptions(true);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);

    try {
      if (order?.status !== "payment_pending") {
        await CustomerService.requestPayment(orderId);
        setShowPaymentOptions(false);
        Swal.fire({
          title: "Đã gửi yêu cầu",
          text: "Vui lòng đợi nhân viên xác nhận hóa đơn trước khi thanh toán.",
          icon: "success",
          confirmButtonColor: "#7e22ce",
        });
        return;
      }

      await CustomerService.selectPaymentMethod(orderId, selectedPaymentMethod);

      if (selectedPaymentMethod === "momo") {
        savePaymentSession(tableId, orderId);
        const momoResponse = await CustomerService.createMomoPayment(orderId);

        if (momoResponse?.payUrl) {
          window.location.href = momoResponse.payUrl;
          return;
        }

        throw new Error(momoResponse?.message || "Không thể tạo thanh toán MoMo");
      }

      setShowPaymentOptions(false);
      Swal.fire({
        title:
          selectedPaymentMethod === "cash"
            ? "Đã chọn tiền mặt"
            : "Cổng thanh toán đang bảo trì",
        text:
          selectedPaymentMethod === "cash"
            ? "Vui lòng đợi nhân viên đến thu tiền."
            : "Vui lòng chọn phương thức thanh toán khác.",
        icon: "info",
        confirmButtonColor: "#7e22ce",
      });
    } catch (err) {
      console.error("Payment request error:", err);
      Swal.fire(
        "Lỗi",
        `Không thể xử lý yêu cầu thanh toán: ${err.message}`,
        "error",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const renderItemStatus = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
            <Clock size={12} /> Chờ duyệt
          </span>
        );
      case "preparing":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
            <ChefHat size={12} /> Đang nấu
          </span>
        );
      case "served":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
            <CheckCircle size={12} /> Đã ra món
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Đang tải hóa đơn...</div>;
  }

  if (!order) {
    return <div className="p-10 text-center">Không tìm thấy đơn hàng</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white p-4 shadow-sm">
        <button
          onClick={onOrderMore}
          className="flex items-center font-medium text-blue-600"
        >
          <ArrowLeft size={20} className="mr-1" />
          Gọi thêm món
        </button>
        <div className="text-right">
          <p className="text-xs text-gray-500">Đơn hàng</p>
          <p className="font-bold text-gray-800">
            #{orderId.toString().slice(-6).toUpperCase()}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 border-b pb-2 text-lg font-bold">
            Danh sách món
          </h3>
          {activeItems.map((item) => (
            <div
              key={item.id || `${item.menu_item_id}-${item.created_at}`}
              className="flex items-start justify-between border-b border-dashed py-3 last:border-0"
            >
              <div className="flex-1">
                <div className="flex justify-between gap-4">
                  <span className="font-medium text-gray-800">
                    {item.quantity}x {item.name || item.menu_item?.name}
                  </span>
                  <span className="text-gray-600">
                    {formatCurrency(
                      (item.price_at_order || item.price || 0) * item.quantity,
                    )}
                  </span>
                </div>
                {item.notes && (
                  <p className="mt-1 text-xs italic text-gray-400">
                    Ghi chú: {item.notes}
                  </p>
                )}
                <div className="mt-2">{renderItemStatus(item.status)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Tổng tạm tính:</span>
            <span className="text-orange-600">
              {formatCurrency(getOrderTotal(order))}
            </span>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 flex gap-3 border-t bg-white p-4">
        <button
          onClick={onOrderMore}
          className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-700 transition hover:bg-gray-200"
        >
          Gọi thêm
        </button>
        <button
          onClick={handleRequestPayment}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-bold text-white shadow-lg hover:bg-purple-700"
        >
          <DollarSign size={20} />
          Thanh toán
        </button>
      </div>

      {showPaymentOptions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <CreditCard size={24} />
                Chọn phương thức thanh toán
              </h3>
              <button
                onClick={() => setShowPaymentOptions(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                x
              </button>
            </div>

            <div className="mb-6 space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;

                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    disabled={isProcessing || method.disabled}
                    className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition ${
                      selectedPaymentMethod === method.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    } ${
                      isProcessing || method.disabled
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }`}
                  >
                    <Icon size={28} />
                    <div>
                      <div className="font-bold text-gray-800">
                        {method.name}
                      </div>
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
                );
              })}
            </div>

            <div className="mb-4 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Tổng thanh toán:</span>
                <span className="text-purple-600">
                  {formatCurrency(getOrderTotal(order))}
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
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
