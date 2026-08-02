export const getFilteredWaiterOrders = (orders, filter) => {
  return orders.filter((order) => {
    if (filter === "all") {
      return order.status !== "completed" && order.status !== "cancelled";
    }

    if (filter === "pending") {
      return (
        order.status === "pending" ||
        order.items?.some((item) => item.status === "pending")
      );
    }

    if (filter === "payment") {
      return (
        order.status === "payment_request" || order.status === "payment_pending"
      );
    }

    return order.status === filter;
  });
};

export const upsertWaiterOrder = (orders, updatedOrder) => {
  const exists = orders.some((order) => order.id === updatedOrder.id);
  return exists
    ? orders.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order,
      )
    : [updatedOrder, ...orders];
};

export const updateWaiterOrderStatusOptimistically = (
  orders,
  orderId,
  status,
) => {
  return orders.map((order) => {
    if (String(order.id) !== String(orderId)) return order;

    if (status === "confirmed") {
      const items = (order.items || []).map((item) =>
        item.status === "pending" ? { ...item, status: "confirmed" } : item,
      );
      return { ...order, status: "confirmed", items };
    }

    if (status === "served") {
      const items = (order.items || []).map((item) =>
        item.status === "ready" ? { ...item, status: "served" } : item,
      );
      return { ...order, items };
    }

    return { ...order, status };
  });
};

export const rejectWaiterOrderItemOptimistically = (
  orders,
  orderId,
  itemId,
  rejectReason,
) => {
  return orders.map((order) => {
    if (String(order.id) !== String(orderId)) return order;

    const items = (order.items || []).map((item) =>
      String(item.id) === String(itemId)
        ? { ...item, status: "cancelled", reject_reason: rejectReason }
        : item,
    );

    return { ...order, items };
  });
};

export const getMinutesWaiting = (date) => {
  if (!date) return 0;
  const diff = new Date() - new Date(date);
  return Math.floor(diff / 60000);
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const getWaiterStatusLabel = (status) => {
  const labels = {
    pending: "Chờ duyệt",
    confirmed: "Đã duyệt",
    preparing: "Đang nấu",
    ready: "Sẵn sàng",
    served: "Đã phục vụ",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
    payment_request: "Yêu cầu thanh toán",
    payment_pending: "Chờ thanh toán",
  };

  return labels[status] || status;
};
