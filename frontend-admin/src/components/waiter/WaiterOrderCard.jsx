import React from "react";
import {
  Bell,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Trash2,
  Utensils,
} from "lucide-react";

const getOrderBorderClass = ({
  hasNewRequest,
  hasReadyToServe,
  isPaymentPending,
  isPaymentRequest,
  orderStatus,
}) => {
  if (isPaymentRequest) {
    return "border-purple-500 border-2 shadow-purple-100 ring-2 ring-purple-100";
  }
  if (isPaymentPending) return "border-orange-500 border-2 shadow-orange-100";
  if (hasNewRequest) {
    return "border-red-500 border-2 shadow-red-100 ring-2 ring-red-100";
  }
  if (hasReadyToServe) return "border-green-500 border-2 shadow-green-100";
  if (orderStatus === "pending") return "border-yellow-500 border-l-4";
  return "border-gray-200";
};

const getHeaderClass = ({
  hasNewRequest,
  hasReadyToServe,
  isPaymentPending,
  isPaymentRequest,
}) => {
  if (isPaymentRequest) return "bg-purple-50";
  if (isPaymentPending) return "bg-orange-50";
  if (hasNewRequest) return "bg-red-50";
  if (hasReadyToServe) return "bg-green-50";
  return "bg-gray-50";
};

const WaiterOrderCard = ({
  formatCurrency,
  getMinutesWaiting,
  getStatusLabel,
  onConfirmCashPayment,
  onOpenBillModal,
  onRejectItem,
  onUpdateStatus,
  order,
}) => {
  const orderId = order.id;
  const pendingItems =
    order.items?.filter((item) => item.status === "pending") || [];
  const readyItems = order.items?.filter((item) => item.status === "ready") || [];
  const visibleItems =
    order.items?.filter((item) => item.status !== "pending") || [];

  const isPaymentRequest = order.status === "payment_request";
  const isPaymentPending = order.status === "payment_pending";
  const hasNewRequest = pendingItems.length > 0;
  const hasReadyToServe = readyItems.length > 0;

  const borderClass = getOrderBorderClass({
    hasNewRequest,
    hasReadyToServe,
    isPaymentPending,
    isPaymentRequest,
    orderStatus: order.status,
  });

  return (
    <div
      className={`bg-white rounded-xl shadow-sm overflow-hidden flex flex-col transition-all ${borderClass}`}
    >
      <div
        className={`p-3 flex justify-between items-center ${getHeaderClass({
          hasNewRequest,
          hasReadyToServe,
          isPaymentPending,
          isPaymentRequest,
        })}`}
      >
        <div className="flex flex-col">
          <h3 className="font-bold text-lg text-gray-800">
            Bàn {order.table?.table_number || "Không rõ"}
          </h3>
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            <Clock size={10} /> {getMinutesWaiting(order.created_at)} phút
          </span>
        </div>

        {hasNewRequest && (
          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse flex gap-1">
            <Bell size={10} /> MỚI
          </span>
        )}
        {!hasNewRequest && hasReadyToServe && (
          <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce flex gap-1">
            <CheckCircle size={10} /> XONG
          </span>
        )}
        {isPaymentRequest && (
          <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse">
            CẦN T.TOÁN
          </span>
        )}
        {isPaymentPending && (
          <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded">
            CHỜ THU TIỀN
          </span>
        )}
      </div>

      <div className="p-4 space-y-4 max-h-80 overflow-y-auto flex-1">
        {pendingItems.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-2">
            <p className="text-[10px] text-red-600 font-bold mb-2 uppercase border-b border-red-200 pb-1">
              Cần xác nhận ({pendingItems.length})
            </p>
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="mb-2 last:mb-0 flex justify-between items-start border-b border-red-100 pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <span className="font-bold text-gray-900 text-sm">
                    {item.quantity}x {item.menu_item?.name}
                  </span>
                  {item.modifiers?.length > 0 && (
                    <span className="text-[10px] text-gray-500 italic pl-1">
                      {" "}
                      +{" "}
                      {item.modifiers
                        .map((modifier) => modifier.modifier_option?.name)
                        .join(", ")}
                    </span>
                  )}
                  {item.notes && (
                    <span className="text-[10px] text-orange-600 pl-1">
                      {" "}
                      "{item.notes}"
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onRejectItem(orderId, item.id)}
                  className="text-red-400 hover:text-red-700 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {visibleItems.length > 0 && (
          <div className="mt-2">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className={`flex justify-between items-center mb-2 pb-1 border-b border-gray-50 last:border-0 ${
                  item.status === "cancelled" ? "opacity-50" : ""
                }`}
              >
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-medium ${
                      item.status === "cancelled" ? "line-through" : ""
                    }`}
                  >
                    {item.quantity}x {item.menu_item?.name}
                  </span>

                  {item.modifiers?.length > 0 && (
                    <span className="text-[10px] text-gray-500 italic pl-1">
                      +{" "}
                      {item.modifiers
                        .map((modifier) => modifier.modifier_option?.name)
                        .join(", ")}
                    </span>
                  )}

                  {item.notes && (
                    <span className="text-[10px] text-orange-600 pl-1 font-medium">
                      Ghi chú: "{item.notes}"
                    </span>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] bg-gray-100 px-1 rounded text-gray-500">
                      {getStatusLabel(item.status)}
                    </span>
                    {item.status === "cancelled" && (
                      <span className="text-[9px] text-red-500">
                        {item.reject_reason}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-100 mt-auto">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-500 text-xs">Tổng tạm tính</span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(order.total_amount)}
          </span>
        </div>

        {hasNewRequest ? (
          <button
            onClick={() => onUpdateStatus(orderId, "confirmed")}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            <CheckCircle size={16} /> Duyệt {pendingItems.length} món mới
          </button>
        ) : hasReadyToServe ? (
          <button
            onClick={() => onUpdateStatus(orderId, "served")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2 animate-pulse"
          >
            <Utensils size={16} /> Bưng {readyItems.length} món xong
          </button>
        ) : isPaymentRequest ? (
          <button
            onClick={() => onOpenBillModal(order)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2 animate-bounce-slow"
          >
            <DollarSign size={16} /> Lập Hóa Đơn
          </button>
        ) : isPaymentPending ? (
          <div className="space-y-2">
            {!order.payment_method ? (
              <div className="text-center text-xs text-purple-600 font-bold bg-purple-100 p-2 rounded animate-pulse">
                Đang chờ khách chọn phương thức thanh toán...
              </div>
            ) : order.payment_method === "cash" ? (
              <>
                <div className="text-center text-xs text-green-600 font-bold bg-green-100 p-1 rounded">
                  Khách chọn: Tiền mặt
                </div>
                <button
                  onClick={() => onConfirmCashPayment(orderId)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
                >
                  <CreditCard size={16} /> Thu tiền mặt
                </button>
              </>
            ) : order.payment_method === "momo" ? (
              <div className="text-center text-xs text-pink-600 font-bold bg-pink-100 p-2 rounded">
                Đang chờ khách thanh toán MoMo
              </div>
            ) : order.payment_method === "vnpay" ? (
              <div className="text-center text-xs text-blue-600 font-bold bg-blue-100 p-2 rounded">
                Đang chờ khách thanh toán VNPay
              </div>
            ) : (
              <div className="text-center text-xs text-gray-600 font-bold bg-gray-100 p-2 rounded">
                Đang chờ thanh toán ({order.payment_method})...
              </div>
            )}
          </div>
        ) : (
          <span className="text-center block text-xs text-gray-400">
            Đang phục vụ...
          </span>
        )}
      </div>
    </div>
  );
};

export default WaiterOrderCard;
