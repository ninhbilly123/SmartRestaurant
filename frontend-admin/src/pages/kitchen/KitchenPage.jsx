import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OrderCard from "../../components/kitchen/OrderCard";
import { OVERDUE_TIME, WARNING_TIME } from "../../constants/kitchenDisplay";
import useKitchenOrders from "../../hooks/useKitchenOrders";
import { clearAuth } from "../../utils/auth";
import { getFilteredKitchenOrders } from "../../utils/kitchenOrders";

const KitchenPage = () => {
  const navigate = useNavigate();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState("all");
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
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      clearAuth();
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">🍳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <header className="bg-gray-900 text-white shadow-md sticky top-0 z-20">
        <div className="max-w-8xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider">
                Màn hình bếp
              </h1>
              <p className="text-xs text-gray-400">
                Đang hoạt động • {new Date().toLocaleTimeString("vi-VN")}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSoundEnabled((enabled) => !enabled)}
              className={`p-2 rounded-lg font-bold text-sm flex items-center gap-2 ${
                soundEnabled ? "bg-green-600" : "bg-gray-700"
              }`}
            >
              {soundEnabled ? "🔊 Bật" : "🔇 Tắt"}
            </button>
            <button
              onClick={refresh}
              className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"
            >
              ↻
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-500 font-bold text-sm"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b sticky top-[64px] z-10 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 flex overflow-x-auto gap-4 pt-3 pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`pb-3 px-4 text-sm font-bold uppercase border-b-4 transition-all flex items-center gap-2 whitespace-nowrap ${
                filter === tab.key
                  ? tab.color || "border-gray-800 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {tab.key !== "all" && (
                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="p-4 pb-24 max-w-8xl mx-auto">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 border border-red-300">
            ⚠️ {error}
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <div className="text-6xl mb-4">👨‍🍳</div>
            <h2 className="text-2xl font-bold">Bếp đang rảnh</h2>
            <p>Chưa có đơn hàng nào cần xử lý</p>
          </div>
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

        <div className="mt-8 flex justify-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Mới
            (&lt;{WARNING_TIME}p)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Chậm (
            {WARNING_TIME}-{OVERDUE_TIME}p)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>{" "}
            Quá hạn (&gt;{OVERDUE_TIME}p)
          </span>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 shadow-lg z-20 hidden md:block">
        <div className="flex justify-center gap-12 text-center">
          <div>
            <div className="text-xs text-gray-500 uppercase">Chờ nấu</div>
            <div className="text-xl font-bold text-red-600">
              {stats.pending}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Đang nấu</div>
            <div className="text-xl font-bold text-blue-600">
              {stats.preparing}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Sẵn sàng</div>
            <div className="text-xl font-bold text-green-600">
              {stats.ready}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Hoàn tất hôm nay</div>
            <div className="text-xl font-bold text-gray-800">
              {stats.completedToday}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default KitchenPage;
