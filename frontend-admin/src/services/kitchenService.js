import { adminApi } from "../config/api.js";

const kitchenService = {
  getKitchenOrders: async (status = null) => {
    const params = status ? { status } : {};
    const response = await adminApi.get("/kitchen/orders", { params });
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await adminApi.patch(`/kitchen/orders/${orderId}/status`, {
      status,
    });
    return response.data;
  },

  updateOrderItemStatus: async (itemId, status) => {
    const response = await adminApi.put(`/kitchen/items/${itemId}/status`, {
      status,
    });
    return response.data;
  },

  getKitchenStats: async () => {
    const response = await adminApi.get("/kitchen/stats");
    return response.data;
  },
};

export default kitchenService;
