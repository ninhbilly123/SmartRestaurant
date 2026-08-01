import { adminApi } from "../config/api";

const reportService = {
  // 1. Lấy thống kê 4 thẻ trên cùng
  getDashboardStats: async () => {
    const response = await adminApi.get("/reports/stats");
    return response.data;
  },

  // 2. Lấy dữ liệu biểu đồ doanh thu
  getRevenueChart: async (fromDate, toDate) => {
    const response = await adminApi.get("/reports/revenue", {
      params: { fromDate, toDate }
    });
    return response.data;
  },

  // 3. Lấy Top món bán chạy
  getTopItems: async (fromDate, toDate) => {
    const response = await adminApi.get("/reports/top-items", {
      params: { fromDate, toDate }
    });
    return response.data;
  },

  getPeakHours: async () => {
    const response = await adminApi.get("/reports/peak-hours");
    return response.data;
  }
};

export default reportService;
