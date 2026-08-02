import React from "react";
import { Utensils } from "lucide-react";

const WaiterEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
      <Utensils size={48} className="mb-4 opacity-20" />
      <p>Hiện chưa có đơn hàng nào.</p>
    </div>
  );
};

export default WaiterEmptyState;
