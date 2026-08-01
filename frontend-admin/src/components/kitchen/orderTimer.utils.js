// Thời gian cảnh báo (phút)
export const WARNING_TIME = 5;
export const OVERDUE_TIME = 10;

// Format thời gian từ giây sang MM:SS
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Tính số giây từ lúc order được tạo
export const getElapsedSeconds = (orderedAt) => {
  const orderTime = new Date(orderedAt).getTime();
  const now = Date.now();
  return Math.floor((now - orderTime) / 1000);
};

// Xác định trạng thái thời gian
export const getTimeStatus = (seconds) => {
  const minutes = seconds / 60;
  if (minutes >= OVERDUE_TIME) return "overdue";
  if (minutes >= WARNING_TIME) return "warning";
  return "ontime";
};
