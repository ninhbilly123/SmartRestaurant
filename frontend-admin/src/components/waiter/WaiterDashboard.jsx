import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Utensils } from "lucide-react";
import { io } from "socket.io-client";
import BillConfirmModal from "./BillConfirmModal";
import WaiterHeader from "./WaiterHeader";
import WaiterOrderCard from "./WaiterOrderCard";
import Alert from "../common/Alert";
import ConfirmDialog from "../common/ConfirmDialog";
import PromptDialog from "../common/PromptDialog";
import waiterService from "../../services/waiterService";
import { clearAuth, getAuthToken } from "../../utils/auth";

// Cấu hình URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
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
  const [notification, setNotification] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [cashPaymentOrderId, setCashPaymentOrderId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

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

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    clearAuth();
    navigate("/login");
  };

  // --- 1. SETUP DATA & SOCKET ---
  useEffect(() => {
    const fetchOrders = async () => {
      if (!getAuthToken()) {
        navigate("/login");
        return;
      }
      try {
        const res = await waiterService.getOrders();
        if (res.success) {
          setOrders(res.data || []);
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
      await waiterService.updateOrderStatus(orderId, status);
    } catch (err) {
      console.error(err);
      window.location.reload(); // Reload nếu lỗi để sync lại data
    }
  };

  // B. Hủy món lẻ
  const handleRejectItem = async (orderId, itemId) => {
    setRejectTarget({ orderId, itemId });
  };

  const confirmRejectItem = async (reason) => {
    if (!rejectTarget) return;
    const { orderId, itemId } = rejectTarget;
    const rejectReason = reason.trim() || "Không có lý do";
    setRejectTarget(null);

    setOrders((prev) =>
      prev.map((o) => {
        if (String(o.id) === String(orderId)) {
          const updatedItems = o.items.map((i) =>
            String(i.id) === String(itemId)
              ? { ...i, status: "cancelled", reject_reason: rejectReason }
              : i,
          );
          return { ...o, items: updatedItems };
        }
        return o;
      }),
    );

    try {
      await waiterService.rejectOrderItem(itemId, rejectReason);
    } catch (err) {
      setNotification({ type: "error", text: `Lỗi: ${err.message}` });
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
    try {
      await waiterService.confirmBill(orderId, billData);
      setIsBillModalOpen(false);
      setNotification({ type: "success", text: "Đã gửi hóa đơn cho khách." });
    } catch (err) {
      setNotification({ type: "error", text: `Lỗi: ${err.message}` });
    }
  };

  // Bước 3: Xác nhận Thu tiền mặt (Khi status = payment_pending)
  const handleConfirmCashPayment = async (orderId) => {
    setCashPaymentOrderId(orderId);
  };

  const confirmCashPayment = async () => {
    if (!cashPaymentOrderId) return;
    const orderId = cashPaymentOrderId;
    setCashPaymentOrderId(null);
    try {
      await waiterService.confirmCashPayment(orderId);
      setTimeout(
        () => setOrders((prev) => prev.filter((o) => o.id !== orderId)),
        1000,
      );
    } catch (err) {
      setNotification({ type: "error", text: `Lỗi: ${err.message}` });
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
      {notification && (
        <Alert
          type={notification.type}
          message={notification.text}
          onClose={() => setNotification(null)}
        />
      )}

      <WaiterHeader
        currentTime={currentTime}
        filter={filter}
        onFilterChange={setFilter}
        onLogout={handleLogout}
      />

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <WaiterOrderCard
            key={order.id}
            formatCurrency={formatCurrency}
            getMinutesWaiting={getMinutesWaiting}
            getStatusLabel={getStatusLabel}
            onConfirmCashPayment={handleConfirmCashPayment}
            onOpenBillModal={handleOpenBillModal}
            onRejectItem={handleRejectItem}
            onUpdateStatus={handleUpdateStatus}
            order={order}
          />
        ))}
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

      <ConfirmDialog
        isOpen={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={confirmLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất?"
        confirmText="Đăng xuất"
      />

      <ConfirmDialog
        isOpen={Boolean(cashPaymentOrderId)}
        onClose={() => setCashPaymentOrderId(null)}
        onConfirm={confirmCashPayment}
        title="Xác nhận thanh toán"
        message="Xác nhận đã thu đủ tiền mặt từ khách?"
        confirmText="Đã thu tiền"
        variant="info"
      />

      <PromptDialog
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={confirmRejectItem}
        title="Hủy món"
        message="Nhập lý do hủy để bếp và phục vụ dễ theo dõi."
        label="Lý do hủy"
        placeholder="VD: Hết hàng, khách đổi ý..."
        confirmText="Xác nhận hủy"
      />
    </div>
  );
};

export default WaiterDashboard;
