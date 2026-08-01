// src/config/api.js (hoặc apiConfig.js)
import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const API_BASE_URL = `${BASE_URL}/api`

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

// ==== THÊM: Customer API (dành riêng cho khách hàng) ====
const customerApi = axios.create({
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
      // const token = localStorage.getItem('authToken');
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }
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
      if (error.response) {
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          "An error occurred";
        return Promise.reject(new Error(message));
      } else if (error.request) {
        return Promise.reject(
          new Error("Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối.")
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
setupInterceptors(customerApi); // THÊM: Áp dụng cho customerApi

// ==== THÊM: Interceptor riêng cho customerApi ====
customerApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("customer_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==== THÊM: Interceptor cho adminApi (nếu cần) ====
// Để không ảnh hưởng đến code hiện tại, chỉ thêm nếu cần
// adminApi.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token"); // token admin
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

export { adminApi, publicApi, customerApi }; // THÊM: Export customerApi
