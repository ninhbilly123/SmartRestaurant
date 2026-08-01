import {
  KITCHEN_HIDDEN_STATUSES,
  KITCHEN_VISIBLE_STATUSES,
} from "../constants/kitchenDisplay";

export const shouldShowKitchenOrder = (order, filter) => {
  if (KITCHEN_HIDDEN_STATUSES.includes(order.status)) {
    return false;
  }

  if (filter === "all") {
    return true;
  }

  if (filter === "pending") {
    return order.status === "confirmed";
  }

  return order.status === filter;
};

export const sortKitchenOrdersByAge = (orders) =>
  [...orders].sort(
    (a, b) =>
      new Date(a.created_at || a.ordered_at) -
      new Date(b.created_at || b.ordered_at),
  );

export const getFilteredKitchenOrders = (orders, filter) =>
  sortKitchenOrdersByAge(
    orders.filter((order) => shouldShowKitchenOrder(order, filter)),
  );

export const mergeKitchenOrder = (orders, updatedOrder) => {
  const exists = orders.some((order) => order.id === updatedOrder.id);

  if (exists) {
    return orders.map((order) =>
      order.id === updatedOrder.id ? updatedOrder : order,
    );
  }

  if (KITCHEN_VISIBLE_STATUSES.includes(updatedOrder.status)) {
    return [updatedOrder, ...orders];
  }

  return orders;
};
