import React from "react";
import { LogOut, Utensils } from "lucide-react";

const FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Cần duyệt" },
  { value: "payment", label: "Thanh toán" },
];

const WaiterHeader = ({ currentTime, filter, onFilterChange, onLogout }) => {
  return (
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
          {FILTERS.map((item) => (
            <button
              key={item.value}
              onClick={() => onFilterChange(item.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === item.value
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all font-medium text-sm"
        >
          <LogOut size={18} /> Đăng xuất
        </button>
      </div>
    </header>
  );
};

export default WaiterHeader;
