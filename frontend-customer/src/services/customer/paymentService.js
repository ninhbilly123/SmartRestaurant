import { apiClient } from "../../config/api";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.error ||
  error.response?.data?.message ||
  error.message ||
  fallback;

export const getActiveOrder = async (tableId) => {
  try {
    const response = await apiClient.get(
      `/customer/tables/${tableId}/active-order`,
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể lấy thông tin đơn hàng"));
  }
};

export const requestPayment = async (orderId) => {
  try {
    const response = await apiClient.post(
      `/customer/orders/${orderId}/request-payment`,
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Yêu cầu thanh toán thất bại"));
  }
};

export const selectPaymentMethod = async (orderId, paymentMethod) => {
  try {
    const response = await apiClient.post(
      `/customer/orders/${orderId}/select-payment-method`,
      { payment_method: paymentMethod },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Không thể chọn phương thức thanh toán"),
    );
  }
};

export const createMomoPayment = async (orderId) => {
  try {
    const response = await apiClient.post("/customer/payment/momo/create", {
      orderId,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể tạo thanh toán MoMo"));
  }
};

export const checkMomoPaymentStatus = async (orderId) => {
  try {
    const response = await apiClient.post("/customer/payment/check-status", {
      orderId,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Không thể kiểm tra trạng thái thanh toán"),
    );
  }
};
