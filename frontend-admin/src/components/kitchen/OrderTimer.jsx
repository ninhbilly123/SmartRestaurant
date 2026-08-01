import React, { useState, useEffect } from "react";
import { formatTime, getElapsedSeconds, getTimeStatus } from "./orderTimer.utils";

// Component hiển thị thời gian chạy
const OrderTimer = ({ orderedAt, status }) => {
  const [elapsed, setElapsed] = useState(getElapsedSeconds(orderedAt));

  useEffect(() => {
    // Chỉ chạy timer nếu order đang pending hoặc preparing
    if (!["pending", "confirmed", "preparing"].includes(status)) {
      return;
    }

    const interval = setInterval(() => {
      setElapsed(getElapsedSeconds(orderedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [orderedAt, status]);

  const timeStatus = getTimeStatus(elapsed);

  const statusColors = {
    ontime: "text-green-500",
    warning: "text-yellow-500",
    overdue: "text-red-500",
  };

  const statusIcons = {
    ontime: "🟢",
    warning: "🟡",
    overdue: "🔴",
  };

  return (
    <div
      className={`flex items-center gap-2 font-mono text-lg ${statusColors[timeStatus]}`}
    >
      <span>⏱️</span>
      <span>{formatTime(elapsed)}</span>
      <span>{statusIcons[timeStatus]}</span>
    </div>
  );
};

export default OrderTimer;
