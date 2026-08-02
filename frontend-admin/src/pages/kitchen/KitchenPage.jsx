import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import {
  KitchenEmptyState,
  KitchenFilterTabs,
  KitchenHeader,
  KitchenLegend,
  KitchenLoadingState,
  KitchenStatsFooter,
  OrderCard,
} from "../../components/kitchen";
import useKitchenOrders from "../../hooks/useKitchenOrders";
import { clearAuth } from "../../utils/auth";
import { getFilteredKitchenOrders } from "../../utils/kitchenOrders";

const KitchenPage = () => {
  const navigate = useNavigate();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState("all");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const {
    error,
    handleReadyOrder,
    handleStartOrder,
    loading,
    orders,
    refresh,
    stats,
    updatingOrders,
  } = useKitchenOrders(soundEnabled);

  const filteredOrders = useMemo(
    () => getFilteredKitchenOrders(orders, filter),
    [orders, filter],
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const filterTabs = [
    { key: "all", label: "Tất cả", count: filteredOrders.length },
    {
      key: "pending",
      label: "Chờ nấu",
      count: stats.pending,
      color: "border-yellow-500 text-yellow-700",
    },
    {
      key: "preparing",
      label: "Đang nấu",
      count: stats.preparing,
      color: "border-blue-500 text-blue-700",
    },
    {
      key: "ready",
      label: "Sẵn sàng",
      count: stats.ready,
      color: "border-green-500 text-green-700",
    },
  ];

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    clearAuth();
    navigate("/login");
  };

  if (loading) return <KitchenLoadingState />;

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <KitchenHeader
        currentTime={currentTime}
        onLogout={handleLogout}
        onRefresh={refresh}
        onToggleSound={() => setSoundEnabled((enabled) => !enabled)}
        soundEnabled={soundEnabled}
      />

      <KitchenFilterTabs
        activeFilter={filter}
        onFilterChange={setFilter}
        tabs={filterTabs}
      />

      <main className="p-4 pb-24 max-w-8xl mx-auto">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 border border-red-300">
            ⚠️ {error}
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <KitchenEmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStartOrder={handleStartOrder}
                onReadyOrder={handleReadyOrder}
                isUpdating={updatingOrders.has(order.id)}
              />
            ))}
          </div>
        )}

        <KitchenLegend />
      </main>

      <KitchenStatsFooter stats={stats} />

      <ConfirmDialog
        isOpen={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={confirmLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất?"
        confirmText="Đăng xuất"
      />
    </div>
  );
};

export default KitchenPage;
