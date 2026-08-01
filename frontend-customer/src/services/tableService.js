import { apiClient } from "../config/api";

const tableService = {
  getTableNumberById: async (id) => {
    const response = await apiClient.get(`/public/name/${id}`);
    return response.data;
  },

  // Verify QR code token (public endpoint)
  verifyQRToken: async (tableId, token, filters = {}) => {
    const params = { table: tableId, token };

    // Thêm các filter params nếu có
    if (filters.q) params.q = filters.q;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.chefRecommended)
      params.chefRecommended = filters.chefRecommended;
    if (filters.sort) params.sort = filters.sort;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    const response = await apiClient.get("/menu", { params });
    return response.data;
  },

  // Lấy menu với filters (sử dụng token đã lưu)
  getMenuWithFilters: async (tableId, token, filters = {}) => {
    const params = { table: tableId, token };

    if (filters.q) params.q = filters.q;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.chefRecommended)
      params.chefRecommended = filters.chefRecommended;
    if (filters.sort) params.sort = filters.sort;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    const response = await apiClient.get("/menu", { params });
    return response.data;
  },
};

export default tableService;
