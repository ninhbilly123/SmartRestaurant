import axios from "axios";
import { clearAuth, getAuthToken } from "../utils/auth";

const API_HOST = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const API_BASE_URL = `${API_HOST}/api`;

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    "Content-Type": "application/json",
  },
});

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const setupInterceptors = (instance) => {
  instance.interceptors.request.use(
    (config) => {
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

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        clearAuth();
        window.location.href = "/#/login";
      }

      if (error.response) {
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          "Đã có lỗi xảy ra";
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

setupInterceptors(adminApi);
setupInterceptors(apiClient);

export { adminApi, apiClient };
