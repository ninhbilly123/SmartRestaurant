// src/config/api.js (hoặc apiConfig.js)
import axios from "axios";
import { clearAuth, getAuthToken } from "../utils/auth";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const API_BASE_URL = `${BASE_URL}/api`;

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Public API (không cần /admin prefix)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor chung
const setupInterceptors = (instance) => {
  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Add auth token here when authentication is implemented
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Xử lý lỗi 401 (Token hết hạn hoặc không hợp lệ)
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn("Token hết hạn hoặc không hợp lệ. Đang đăng xuất...");
        
        // Xóa token bẩn
        clearAuth();
        
        // Đá về trang Login (Dùng window.location để refresh lại app sạch sẽ)
        // Vì bạn dùng HashRouter nên đường dẫn là /#/login
        window.location.href = '/#/login'; 
      }

      
      if (error.response) {
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          "An error occurred";
        return Promise.reject(new Error(message));
      } else if (error.request) {
        return Promise.reject(
          new Error("No response from server. Please check your connection.")
        );
      } else {
        return Promise.reject(error);
      }
    }
  );
};

// Áp dụng interceptors cho cả hai instances
setupInterceptors(adminApi);
setupInterceptors(publicApi);

export { adminApi, publicApi };
