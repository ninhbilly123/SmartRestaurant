import { publicApi } from "../config/api";

export const login = async (credentials) => {
  const response = await publicApi.post("/auth/login", credentials);
  return response.data;
};

// 1. Lấy danh sách user
export const getAllUsers = async () => {
  const response = await publicApi.get("/auth/users");
  return response.data;
};

// 2. Tạo user mới
export const createNewUser = async (userData) => {
  const response = await publicApi.post("/auth/create-user", userData);
  return response.data;
};

// 3. Cập nhật thông tin User (Edit)
export const updateUser = async (id, userData) => {
  const response = await publicApi.put(`/auth/users/${id}`, userData);
  return response.data;
};

// 4. Đổi trạng thái Khóa/Mở khóa (Deactivate)
export const toggleUserStatus = async (id, isActive) => {
  const response = await publicApi.patch(`/auth/users/${id}/status`, { is_active: isActive });
  return response.data;
};
