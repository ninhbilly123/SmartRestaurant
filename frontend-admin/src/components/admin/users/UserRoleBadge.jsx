import React from "react";
import { ChefHat, Coffee } from "lucide-react";
import { getRoleLabel } from "../../../constants/roles";

const roleClasses = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  super_admin: "bg-purple-100 text-purple-700 border-purple-200",
  waiter: "bg-blue-100 text-blue-800 border-blue-200",
  kitchen: "bg-orange-100 text-orange-800 border-orange-200",
};

const UserRoleBadge = ({ role, showIcon = false }) => {
  const className = roleClasses[role] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${className}`}
    >
      {showIcon && (role === "kitchen" ? <ChefHat size={14} /> : <Coffee size={14} />)}
      {getRoleLabel(role).toUpperCase()}
    </span>
  );
};

export default UserRoleBadge;
