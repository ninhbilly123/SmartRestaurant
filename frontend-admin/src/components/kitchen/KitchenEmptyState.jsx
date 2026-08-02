import React from "react";
import { ChefHat } from "lucide-react";

const KitchenEmptyState = () => {
  return (
    <div className="text-center py-20 opacity-40">
      <ChefHat className="w-16 h-16 mx-auto mb-4" />
      <h2 className="text-2xl font-bold">Bếp đang rảnh</h2>
      <p>Chưa có đơn hàng nào cần xử lý</p>
    </div>
  );
};

export default KitchenEmptyState;
