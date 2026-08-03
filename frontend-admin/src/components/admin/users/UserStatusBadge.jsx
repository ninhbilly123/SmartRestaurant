import React from "react";

const UserStatusBadge = ({ isActive, rounded = "lg" }) => {
  const roundedClass = rounded === "full" ? "rounded-full" : "rounded-lg";

  return isActive ? (
    <span
      className={`inline-flex items-center gap-1.5 text-green-700 font-bold text-xs bg-green-100 px-3 py-1.5 ${roundedClass} border border-green-200`}
    >
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      Hoạt động
    </span>
  ) : (
    <span
      className={`inline-flex items-center gap-1.5 text-red-700 font-bold text-xs bg-red-100 px-3 py-1.5 ${roundedClass} border border-red-200`}
    >
      <span className="w-2 h-2 bg-red-500 rounded-full" />
      Đã khóa
    </span>
  );
};

export default UserStatusBadge;
