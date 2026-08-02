import React from "react";
import { ChefHat } from "lucide-react";

const KitchenLoadingState = () => {
  return (
    <div className="h-screen flex items-center justify-center">
      <ChefHat className="w-10 h-10 animate-spin text-gray-700" />
    </div>
  );
};

export default KitchenLoadingState;
