import React from "react";
import { DollarSign, ShoppingBag, Users, Utensils } from "lucide-react";
import { formatCurrency } from "../../../utils/reportData";

const ReportStatsGrid = ({ stats }) => {
  const items = [
    {
      icon: DollarSign,
      iconClassName: "bg-green-100 text-green-600",
      label: "Doanh thu hôm nay",
      value: formatCurrency(stats.revenue),
    },
    {
      icon: ShoppingBag,
      iconClassName: "bg-blue-100 text-blue-600",
      label: "Đơn hàng hôm nay",
      value: stats.orders,
    },
    {
      icon: Users,
      iconClassName: "bg-orange-100 text-orange-600",
      label: "Khách đang ngồi",
      value: stats.activeTables,
    },
    {
      icon: Utensils,
      iconClassName: "bg-purple-100 text-purple-600",
      label: "Tổng món phục vụ",
      value: "--",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {item.label}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {item.value}
                </h3>
              </div>
              <div className={`p-3 rounded-lg ${item.iconClassName}`}>
                <Icon size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReportStatsGrid;
