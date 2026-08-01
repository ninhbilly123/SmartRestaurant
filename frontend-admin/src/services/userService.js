import { apiClient } from "../config/api";

export const getAllUsers = async () => {
  const response = await apiClient.get("/auth/users");
  return response.data;
};

export const createUser = async (userData) => {
  const response = await apiClient.post("/auth/create-user", userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await apiClient.put(`/auth/users/${id}`, userData);
  return response.data;
};

export const toggleUserStatus = async (id, isActive) => {
  const response = await apiClient.patch(`/auth/users/${id}/status`, {
    is_active: isActive,
  });
  return response.data;
};
