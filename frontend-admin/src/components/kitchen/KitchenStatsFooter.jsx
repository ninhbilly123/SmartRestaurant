import React from "react";

const statItems = [
  { key: "pending", label: "Chờ nấu", className: "text-red-600" },
  { key: "preparing", label: "Đang nấu", className: "text-blue-600" },
  { key: "ready", label: "Sẵn sàng", className: "text-green-600" },
  { key: "completedToday", label: "Hoàn tất hôm nay", className: "text-gray-800" },
];

const KitchenStatsFooter = ({ stats }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 shadow-lg z-20 hidden md:block">
      <div className="flex justify-center gap-12 text-center">
        {statItems.map((item) => (
          <div key={item.key}>
            <div className="text-xs text-gray-500 uppercase">{item.label}</div>
            <div className={`text-xl font-bold ${item.className}`}>
              {stats[item.key]}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
};

export default KitchenStatsFooter;
