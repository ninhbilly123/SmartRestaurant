import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Utensils,
  Bell,
  CheckCircle,
  Clock,
  Trash2,
  XCircle,
  CreditCard, // Mới
  DollarSign, // Mới
} from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";
import BillConfirmModal from "./BillConfirmModal"; // Đảm bảo đường dẫn đúng

// Cấu hình URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api`;
const SOCKET_URL = API_BASE;

// Âm thanh thông báo (base64)
const NOTIFICATION_SOUND =
  "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleJlvwY+nMx8LP5jW3LJ5dGm9iqQvHwk/l9XXtnl1Z7iNpTIgCD+Y1di5e3Zlt4+mNSIIP5rV2Lx8d2S1kafxIwg/m9TYvn15ZLOTqPYkCT+c1NjAfnplsZWp+SUJP57U2MJ/e2WvlqryJgk/n9TYw4B8ZayXq+0nCT+g1NjEgX1lq5ir6CgJP6HU2MWCfmWomKzjKQk/otTYxoN/ZaaZrd4qCT+j1NjHhIBmpaub2SsJP6TU2MiFgGajq53ULAk/pdTYyYaBZqKsnc8tCT+m1NjKh4Jmoa2eyi4JP6fU2MuIg2afsJ7FMAI/qNTYzImDZp6xnsEzAj+p1NjNioRmnrKevjQCP6rU2M6KhGadsZ67NgI/q9TYz4uFZpy0nrg3Aj+s1NjQi4Vmm7WesTkCP63U2NGMhmabtp6tOgI/rtTY0o2GZpq3nqk8Aj+v1NjTjYdmmbiepj0CP7DU2NSNh2aZuZ6iQAI/sdTY1Y6IZpi6np5BAj+y1NjWj4lml7yelkMCP7PU2NeQiWaXvJ6SRAJAstXX2JCKZpa9npBFAkCz1dfZkYtmr8GdjkYCQH/M0tqXk26jy5yISQJAbr/H3J+edoTD1INQAkBbutfbnqBs";

const WaiterDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- STATE CHO MODAL THANH TOÁN ---
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  const socketRef = useRef();
  const audioRef = useRef();
  const navigate = useNavigate();

  // Khởi tạo audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 0.8;
  }, []);

  // Hàm phát âm thanh thông báo
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  // --- 0. HÀM ĐĂNG XUẤT ---
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  // --- 1. SETUP DATA & SOCKET ---
  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setOrders(res.data.data || []);
        }
      } catch (err) {
        console.error("Lỗi API:", err);
      }
    };
    fetchOrders();

    socketRef.current = io(SOCKET_URL);

    // Nghe sự kiện đơn mới
    socketRef.current.on("new_order_created", (updatedOrder) => {
      playNotificationSound();
      setOrders((prev) => {
        const exists = prev.find((o) => o.id === updatedOrder.id);
        return exists
          ? prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
          : [updatedOrder, ...prev];
      });
    });

    // Nghe sự kiện update chung
    socketRef.current.on("order_status_updated", (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
      );
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. CÁC HÀM XỬ LÝ API ---

  // A. Update trạng thái (Duyệt/Bưng) - Logic cũ
  const handleUpdateStatus = async (orderId, status) => {
    const token = localStorage.getItem("token");

    // Optimistic UI
    setOrders((prev) =>
      prev.map((o) => {
        if (String(o.id) === String(orderId)) {
          if (status === "confirmed") {
            const updatedItems = o.items.map((i) =>
              i.status === "pending" ? { ...i, status: "confirmed" } : i,
            );
            return { ...o, status: "confirmed", items: updatedItems };
          } else if (status === "served") {
            const updatedItems = o.items.map((i) =>
              i.status === "ready" ? { ...i, status: "served" } : i,
            );
            return { ...o, items: updatedItems }; // Status order có thể chưa đổi nếu chưa hết món
          }
          return { ...o, status: status };
        }
        return o;
      }),
    );

    try {
      await axios.put(
        `${API_URL}/admin/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      console.error(err);
      window.location.reload(); // Reload nếu lỗi để sync lại data
    }
  };

  // B. Hủy món lẻ
  const handleRejectItem = async (orderId, itemId) => {
    const reason = window.prompt(
      "Lý do hủy món này? (VD: Hết hàng, Khách đổi ý)",
    );
    if (reason === null) return;

    const token = localStorage.getItem("token");
    setOrders((prev) =>
      prev.map((o) => {
        if (String(o.id) === String(orderId)) {
          const updatedItems = o.items.map((i) =>
            String(i.id) === String(itemId)
              ? { ...i, status: "cancelled", reject_reason: reason }
              : i,
          );
          return { ...o, items: updatedItems };
        }
        return o;
      }),
    );

    try {
      await axios.put(
        `${API_URL}/admin/orders/items/${itemId}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  // --- 3. [MỚI] LOGIC THANH TOÁN 2 BƯỚC ---

  // Bước 1: Mở Modal Lập Hóa Đơn (Khi status = payment_request)
  const handleOpenBillModal = (order) => {
    setSelectedOrderForBill(order);
    setIsBillModalOpen(true);
  };

  // Bước 2: Gọi API Confirm Bill (Gửi từ Modal)
  const handleSendBill = async (orderId, billData) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${API_URL}/admin/orders/${orderId}/confirm-bill`,
        billData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsBillModalOpen(false);
      // alert("Đã gửi hóa đơn cho khách!"); // Có thể bỏ alert cho mượt
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  // Bước 3: Xác nhận Thu tiền mặt (Khi status = payment_pending)
  const handleConfirmCashPayment = async (orderId) => {
    if (!window.confirm("Xác nhận đã thu đủ tiền mặt từ khách?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${API_URL}/admin/orders/${orderId}/pay`,
        { payment_method: "cash" },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Ẩn đơn hàng sau 1s
      setTimeout(
        () => setOrders((prev) => prev.filter((o) => o.id !== orderId)),
        1000,
      );
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  // --- 4. HELPER ---
  const getMinutesWaiting = (d) => {
    if (!d) return 0;
    const diff = new Date() - new Date(d);
    return Math.floor(diff / 60000);
  };
  const formatCurrency = (a) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(a);
  };
  const getStatusLabel = (status) => {
    const labels = {
      pending: "Chờ duyệt",
      confirmed: "Đã duyệt",
      preparing: "Đang nấu",
      ready: "Sẵn sàng",
      served: "Đã phục vụ",
      completed: "Hoàn tất",
      cancelled: "Đã hủy",
      payment_request: "Yêu cầu thanh toán",
      payment_pending: "Chờ thanh toán",
    };
    return labels[status] || status;
  };

  // Filter Logic Updated
  const filteredOrders = orders.filter((order) => {
    if (filter === "all")
      return order.status !== "completed" && order.status !== "cancelled";
    if (filter === "pending")
      return (
        order.status === "pending" ||
        order.items?.some((i) => i.status === "pending")
      );
    if (filter === "payment")
      // Hiện cả 2 trạng thái thanh toán
      return (
        order.status === "payment_request" || order.status === "payment_pending"
      );
    return order.status === filter;
  });

  // --- 5. RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Utensils size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Màn hình phục vụ
            </h1>
            <p className="text-gray-500 text-sm">
              {currentTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {["all", "pending", "payment"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "all"
                  ? "Tất cả"
                  : f === "pending"
                    ? "Cần duyệt"
                    : "Thanh toán"}
              </button>
            ))}
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all font-medium text-sm"
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </header>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => {
          const orderId = order.id;
          const pendingItems =
            order.items?.filter((i) => i.status === "pending") || [];
          const readyItems =
            order.items?.filter((i) => i.status === "ready") || [];

          // Check Status Mới
          const isPaymentRequest = order.status === "payment_request";
          const isPaymentPending = order.status === "payment_pending";
          const hasNewRequest = pendingItems.length > 0;
          const hasReadyToServe = readyItems.length > 0;

          // Border color logic
          let borderClass = "border-gray-200";
          if (isPaymentRequest)
            borderClass =
              "border-purple-500 border-2 shadow-purple-100 ring-2 ring-purple-100";
          else if (isPaymentPending)
            borderClass = "border-orange-500 border-2 shadow-orange-100";
          else if (hasNewRequest)
            borderClass =
              "border-red-500 border-2 shadow-red-100 ring-2 ring-red-100";
          else if (hasReadyToServe)
            borderClass = "border-green-500 border-2 shadow-green-100";
          else if (order.status === "pending")
            borderClass = "border-yellow-500 border-l-4";

          return (
            <div
              key={orderId}
              className={`bg-white rounded-xl shadow-sm overflow-hidden flex flex-col transition-all ${borderClass}`}
            >
              {/* CARD HEADER */}
              <div
                className={`p-3 flex justify-between items-center ${
                  isPaymentRequest
                    ? "bg-purple-50"
                    : isPaymentPending
                      ? "bg-orange-50"
                      : hasNewRequest
                        ? "bg-red-50"
                        : hasReadyToServe
                          ? "bg-green-50"
                          : "bg-gray-50"
                }`}
              >
                <div className="flex flex-col">
                  <h3 className="font-bold text-lg text-gray-800">
                    Bàn {order.table?.table_number || "Không rõ"}
                  </h3>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock size={10} /> {getMinutesWaiting(order.created_at)}{" "}
                    phút
                  </span>
                </div>

                {/* Badges */}
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

              {/* CARD BODY (LIST MÓN) */}
              <div className="p-4 space-y-4 max-h-80 overflow-y-auto flex-1">
                {/* Phần Render món giữ nguyên như code cũ của bạn vì nó tốt rồi */}
                {pendingItems.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                    <p className="text-[10px] text-red-600 font-bold mb-2 uppercase border-b border-red-200 pb-1">
                      Cần xác nhận ({pendingItems.length})
                    </p>
                    {pendingItems.map((item, idx) => (
                      <div
                        key={idx}
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
                                .map((m) => m.modifier_option?.name)
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
                          onClick={() => handleRejectItem(orderId, item.id)}
                          className="text-red-400 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* List món đang phục vụ */}
                {order.items?.filter((i) => i.status !== "pending").length >
                  0 && (
                  <div className="mt-2">
                    {order.items
                      .filter((i) => i.status !== "pending")
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex justify-between items-center mb-2 pb-1 border-b border-gray-50 last:border-0 ${item.status === "cancelled" ? "opacity-50" : ""}`}
                        >
                          <div className="flex flex-col">
                            <span
                              className={`text-sm font-medium ${item.status === "cancelled" ? "line-through" : ""}`}
                            >
                              {item.quantity}x {item.menu_item?.name}
                            </span>

                            {item.modifiers?.length > 0 && (
                              <span className="text-[10px] text-gray-500 italic pl-1">
                                +{" "}
                                {item.modifiers
                                  .map((m) => m.modifier_option?.name)
                                  .join(", ")}
                              </span>
                            )}

                            {item.notes && (
                              <span className="text-[10px] text-orange-600 pl-1 font-medium">
                                📝 "{item.notes}"
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

              {/* CARD FOOTER (NÚT BẤM QUAN TRỌNG) */}
              <div className="p-3 bg-gray-50 border-t border-gray-100 mt-auto">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-500 text-xs">Tổng tạm tính</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>

                {/* LOGIC HIỂN THỊ NÚT */}
                {hasNewRequest ? (
                  <button
                    onClick={() => handleUpdateStatus(orderId, "confirmed")}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
                  >
                    <CheckCircle size={16} /> Duyệt {pendingItems.length} món
                    mới
                  </button>
                ) : hasReadyToServe ? (
                  <button
                    onClick={() => handleUpdateStatus(orderId, "served")}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2 animate-pulse"
                  >
                    <Utensils size={16} /> Bưng {readyItems.length} món xong
                  </button>
                ) : isPaymentRequest ? (
                  // NÚT LẬP HÓA ĐƠN (Cho bước 1)
                  <button
                    onClick={() => handleOpenBillModal(order)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2 animate-bounce-slow"
                  >
                    <DollarSign size={16} /> Lập Hóa Đơn
                  </button>
                ) : isPaymentPending ? (
                  // NÚT THANH TOÁN - Hiển thị theo payment_method
                  <div className="space-y-2">
                    {!order.payment_method ? (
                      // Chưa chọn phương thức
                      <div className="text-center text-xs text-purple-600 font-bold bg-purple-100 p-2 rounded animate-pulse">
                        Đang chờ khách chọn phương thức thanh toán...
                      </div>
                    ) : order.payment_method === "cash" ? (
                      // Khách chọn tiền mặt
                      <>
                        <div className="text-center text-xs text-green-600 font-bold bg-green-100 p-1 rounded">
                          Khách chọn: Tiền mặt 💵
                        </div>
                        <button
                          onClick={() => handleConfirmCashPayment(orderId)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
                        >
                          <CreditCard size={16} /> Thu tiền mặt
                        </button>
                      </>
                    ) : order.payment_method === "momo" ? (
                      // Khách chọn MoMo
                      <div className="text-center text-xs text-pink-600 font-bold bg-pink-100 p-2 rounded">
                        Đang chờ khách thanh toán MoMo 🟣
                      </div>
                    ) : order.payment_method === "vnpay" ? (
                      // Khách chọn VNPay
                      <div className="text-center text-xs text-blue-600 font-bold bg-blue-100 p-2 rounded">
                        Đang chờ khách thanh toán VNPay 🔵
                      </div>
                    ) : (
                      // Phương thức khác
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
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
          <Utensils size={48} className="mb-4 opacity-20" />
          <p>Hiện chưa có đơn hàng nào.</p>
        </div>
      )}

      {/* MODAL TÍNH TIỀN */}
      <BillConfirmModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        order={selectedOrderForBill}
        onConfirm={handleSendBill}
      />
    </div>
  );
};

export default WaiterDashboard;
