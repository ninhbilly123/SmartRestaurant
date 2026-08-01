import { apiClient, customerApi } from "../../config/api";
import { getCustomerToken, isCustomerLoggedIn } from "../../utils/customerAuth";

const getApiExecutor = () => (getCustomerToken() ? customerApi : apiClient);

const getErrorMessage = (error, fallback) =>
  error.response?.data?.error || error.response?.data?.message || error.message || fallback;

const normalizeCartItems = (cartItems) =>
  cartItems.map((item) => ({
    id: item.id,
    quantity: Number(item.quantity),
    notes: item.notes || item.note || "",
    modifiers: (item.modifiers || []).map((modifier) => ({
      id: modifier.id || modifier.optionId,
      price:
        Number(modifier.price) ||
        Number(modifier.price_adjustment) ||
        Number(modifier.priceAdjustment) ||
        0,
    })),
  }));

export const createOrderWithItems = async (tableId, cartItems) => {
  const response = await getApiExecutor().post("/customer/orders", {
    table_id: tableId,
    items: normalizeCartItems(cartItems),
  });

  return {
    success: true,
    message: "Gửi món thành công",
    data: response.data.data,
  };
};

export const getOrdersByIds = async (orderIds) => {
  try {
    const apiExecutor = getApiExecutor();
    const results = await Promise.all(
      orderIds.map(async (orderId) => {
        const response = await apiExecutor.get(`/customer/orders/${orderId}`);
        return response.data;
      }),
    );

    return {
      success: true,
      data: results.map((result) => result.data || result).flat(),
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Không thể lấy thông tin đơn hàng",
      data: [],
    };
  }
};

export const getOrderWithItems = async (orderId) => {
  try {
    const response = await getApiExecutor().get(
      `/customer/order-items/order/${orderId}`,
    );
    const items = response.data.data || [];

    if (!response.data.success) {
      throw new Error(response.data.message || "Không thể lấy danh sách món");
    }

    return {
      success: true,
      order: items.length > 0 ? items[0].Order : { id: orderId },
      items,
      message: "Lấy dữ liệu thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      order: null,
      items: [],
    };
  }
};

export const getOrders = async (queryParams = {}) => {
  if (!isCustomerLoggedIn()) return { success: true, data: [] };

  const response = await customerApi.get("/customer/orders", {
    params: queryParams,
  });
  return response.data;
};

export const getOrderById = async (orderId) => {
  try {
    if (!isCustomerLoggedIn()) throw new Error("Chưa đăng nhập");
    const response = await customerApi.get(`/customer/orders/${orderId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể lấy thông tin đơn hàng"));
  }
};

export const addItemsToOrder = async (orderId, cartItems) => {
  try {
    const payload = {
      order_id: orderId,
      items: cartItems.map((item) => ({
        menu_item_id: item.id,
        quantity: Number(item.quantity) || 1,
        price_at_order: Number(item.price) || 0,
        notes: item.notes || item.note || "",
        modifiers: (item.modifiers || []).map((modifier) => ({
          id: modifier.id || modifier.optionId,
          price:
            Number(modifier.price) ||
            Number(modifier.price_adjustment) ||
            Number(modifier.priceAdjustment) ||
            0,
        })),
      })),
    };

    const response = await getApiExecutor().post("/customer/order-items", payload);

    return {
      success: true,
      message: "Gọi thêm món thành công",
      data: response.data.data,
    };
  } catch (error) {
    const errorCode = error.response?.data?.code;
    if (["ORDER_NOT_FOUND", "ORDER_CLOSED", "ORDER_LOCKED"].includes(errorCode)) {
      const err = new Error(error.response?.data?.message || "Đơn hàng không hợp lệ");
      err.shouldCreateNewOrder = true;
      throw err;
    }

    throw new Error(getErrorMessage(error, "Không thể gọi thêm món"));
  }
};
