import React from "react";
import { OVERDUE_TIME, WARNING_TIME } from "../../constants/kitchenDisplay";

const KitchenLegend = () => {
  return (
    <div className="mt-8 flex justify-center gap-6 text-xs text-gray-500">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        Mới (&lt;{WARNING_TIME}p)
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
        Chậm ({WARNING_TIME}-{OVERDUE_TIME}p)
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        Quá hạn (&gt;{OVERDUE_TIME}p)
      </span>
    </div>
  );
};

export default KitchenLegend;
