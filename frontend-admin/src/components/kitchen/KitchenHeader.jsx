import React from "react";
import { Flame, LogOut, RotateCw, Volume2, VolumeX } from "lucide-react";

const KitchenHeader = ({
  currentTime,
  onLogout,
  onRefresh,
  onToggleSound,
  soundEnabled,
}) => {
  return (
    <header className="bg-gray-900 text-white shadow-md sticky top-0 z-20">
      <div className="max-w-8xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Flame className="w-8 h-8 text-orange-400" />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider">
              Màn hình bếp
            </h1>
            <p className="text-xs text-gray-400">
              Đang hoạt động • {currentTime.toLocaleTimeString("vi-VN")}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg font-bold text-sm flex items-center gap-2 ${
              soundEnabled ? "bg-green-600" : "bg-gray-700"
            }`}
            title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {soundEnabled ? "Bật" : "Tắt"}
          </button>
          <button
            onClick={onRefresh}
            className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"
            title="Tải lại đơn hàng"
          >
            <RotateCw size={16} />
          </button>
          <button
            onClick={onLogout}
            className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-500 font-bold text-sm flex items-center gap-2"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
};

export default KitchenHeader;
