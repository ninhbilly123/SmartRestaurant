export const getDefaultDateRange = () => ({
  fromDate: new Date(new Date().setDate(new Date().getDate() - 7))
    .toISOString()
    .split("T")[0],
  toDate: new Date().toISOString().split("T")[0],
});

export const buildFullDayPeakHours = (rawData = []) =>
  Array.from({ length: 24 }, (_, hour) => {
    const found = rawData.find((item) => parseInt(item.hour) === hour);
    return {
      hour: `${hour}:00`,
      orders: found ? parseInt(found.order_count) : 0,
    };
  });

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
