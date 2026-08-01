import { adminApi } from "../config/api";

const waiterService = {
  getOrders: async () => {
    const response = await adminApi.get("/orders");
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await adminApi.put(`/orders/${orderId}/status`, {
      status,
    });
    return response.data;
  },

  rejectOrderItem: async (itemId, reason) => {
    const response = await adminApi.put(`/orders/items/${itemId}/reject`, {
      reason,
    });
    return response.data;
  },

  confirmBill: async (orderId, billData) => {
    const response = await adminApi.put(`/orders/${orderId}/confirm-bill`, billData);
    return response.data;
  },

  confirmCashPayment: async (orderId) => {
    const response = await adminApi.put(`/orders/${orderId}/pay`, {
      payment_method: "cash",
    });
    return response.data;
  },
};

export default waiterService;
