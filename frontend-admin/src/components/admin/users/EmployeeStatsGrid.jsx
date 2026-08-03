import React from "react";
import { ChefHat, Coffee, Users } from "lucide-react";

const EmployeeStatsGrid = ({ users }) => {
  const stats = [
    {
      icon: Users,
      label: "Tổng nhân viên",
      value: users.length,
      className: "from-teal-500 to-teal-600",
      iconClassName: "text-teal-200",
    },
    {
      icon: Coffee,
      label: "Phục vụ",
      value: users.filter((user) => user.role === "waiter").length,
      className: "from-blue-500 to-blue-600",
      iconClassName: "text-blue-200",
    },
    {
      icon: ChefHat,
      label: "Bếp",
      value: users.filter((user) => user.role === "kitchen").length,
      className: "from-orange-500 to-orange-600",
      iconClassName: "text-orange-200",
    },
    {
      icon: Users,
      label: "Đang hoạt động",
      value: users.filter((user) => user.is_active).length,
      className: "from-green-500 to-green-600",
      iconClassName: "text-green-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className={`bg-gradient-to-br ${item.className} rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/80 text-sm font-medium">{item.label}</p>
              <Icon className={`w-8 h-8 ${item.iconClassName}`} />
            </div>
            <p className="text-4xl font-bold">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeStatsGrid;
