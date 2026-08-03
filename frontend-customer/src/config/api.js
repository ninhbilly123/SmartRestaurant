import axios from "axios";
import { getCustomerToken } from "../utils/customerAuth";
import { getTableSession } from "../utils/tableSession";

const API_HOST = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const API_BASE_URL = `${API_HOST}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const customerApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const setupInterceptors = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      const { tableId, token } = getTableSession();
      config.headers = config.headers || {};

      if (tableId) {
        config.headers["x-table-id"] = tableId;
      }

      if (token) {
        config.headers["x-qr-token"] = token;
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

setupInterceptors(apiClient);
setupInterceptors(customerApi);

customerApi.interceptors.request.use(
  (config) => {
    const token = getCustomerToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { apiClient, customerApi };
