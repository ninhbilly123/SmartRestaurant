import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/common/Alert";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import PromptDialog from "../../components/common/PromptDialog";
import {
  BillConfirmModal,
  WaiterEmptyState,
  WaiterHeader,
  WaiterLoadingState,
  WaiterOrderCard,
} from "../../components/waiter";
import useWaiterOrders from "../../hooks/useWaiterOrders";
import { clearAuth } from "../../utils/auth";
import { getFilteredWaiterOrders } from "../../utils/waiterOrders";

const DEFAULT_REJECT_REASON = "Không có lý do";

const WaiterPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [cashPaymentOrderId, setCashPaymentOrderId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const showNotification = useCallback((type, text) => {
    setNotification({ type, text });
  }, []);

  const showError = useCallback(
    (message) => showNotification("error", message),
    [showNotification],
  );

  const showSuccess = useCallback(
    (message) => showNotification("success", message),
    [showNotification],
  );

  const handleUnauthorized = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  const {
    confirmBill,
    confirmCashPayment,
    loading,
    orders,
    rejectOrderItem,
    updateOrderStatus,
  } = useWaiterOrders({
    onError: showError,
    onSuccess: showSuccess,
    onUnauthorized: handleUnauthorized,
  });

  const filteredOrders = useMemo(
    () => getFilteredWaiterOrders(orders, filter),
    [orders, filter],
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const handleOpenBillModal = (order) => {
    setSelectedOrderForBill(order);
    setIsBillModalOpen(true);
  };

  const handleSendBill = async (orderId, billData) => {
    const success = await confirmBill(orderId, billData);
    if (success) {
      setIsBillModalOpen(false);
      setSelectedOrderForBill(null);
    }
  };

  const handleConfirmCashPayment = (orderId) => {
    setCashPaymentOrderId(orderId);
  };

  const handleRejectItem = (orderId, itemId) => {
    setRejectTarget({ orderId, itemId });
  };

  const confirmRejectItem = async (reason) => {
    if (!rejectTarget) return;

    const rejectReason = reason.trim() || DEFAULT_REJECT_REASON;
    const { orderId, itemId } = rejectTarget;
    setRejectTarget(null);

    await rejectOrderItem(orderId, itemId, rejectReason);
  };

  const handleCashPaymentConfirmed = async () => {
    if (!cashPaymentOrderId) return;

    const success = await confirmCashPayment(cashPaymentOrderId);
    if (success) {
      setCashPaymentOrderId(null);
    }
  };

  if (loading) return <WaiterLoadingState />;

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

      {filteredOrders.length === 0 ? (
        <WaiterEmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <WaiterOrderCard
              key={order.id}
              onConfirmCashPayment={handleConfirmCashPayment}
              onOpenBillModal={handleOpenBillModal}
              onRejectItem={handleRejectItem}
              onUpdateStatus={updateOrderStatus}
              order={order}
            />
          ))}
        </div>
      )}

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
        onConfirm={handleCashPaymentConfirmed}
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

export default WaiterPage;
