import { customerApi } from "../../config/api";
import { getCustomerInfo, isCustomerLoggedIn, setCustomerInfo } from "../../utils/customerAuth";

const requireLogin = () => {
  if (!isCustomerLoggedIn()) throw new Error("Chưa đăng nhập");
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.error || error.response?.data?.message || error.message || fallback;

export const updateProfile = async (updateData) => {
  try {
    requireLogin();
    const response = await customerApi.put("/customer/profile", updateData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể cập nhật thông tin"));
  }
};

export const changePassword = async (oldPassword, newPassword) => {
  try {
    requireLogin();
    const response = await customerApi.put("/customer/password", {
      oldPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể đổi mật khẩu"));
  }
};

export const updateAvatar = async (avatarFile) => {
  try {
    requireLogin();
    if (!(avatarFile instanceof File)) throw new Error("Phải là đối tượng File");

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    const response = await customerApi.put("/customer/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.data.success) {
      const customerInfo = getCustomerInfo() || {};
      customerInfo.avatar = response.data.data.avatar;
      setCustomerInfo(customerInfo);
    }

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể cập nhật ảnh đại diện"));
  }
};

export const deleteAvatar = async () => {
  try {
    requireLogin();
    const response = await customerApi.delete("/customer/avatar");
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể xóa ảnh đại diện"));
  }
};

export const getMe = async () => {
  try {
    requireLogin();
    const response = await customerApi.get("/customer/me");
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể lấy thông tin"));
  }
};

export const updateMe = async (updateData) => {
  try {
    requireLogin();
    const response = await customerApi.put("/customer/me", updateData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể cập nhật thông tin"));
  }
};
