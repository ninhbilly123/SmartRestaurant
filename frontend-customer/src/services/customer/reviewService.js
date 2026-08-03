import { apiClient, customerApi } from "../../config/api";
import { getCustomerToken } from "../../utils/customerAuth";

const getApiExecutor = () => (getCustomerToken() ? customerApi : apiClient);

const getErrorMessage = (error, fallback) =>
  error.response?.data?.error ||
  error.response?.data?.message ||
  error.message ||
  fallback;

export const createReview = async (reviewData) => {
  try {
    const response = await getApiExecutor().post("/customer/reviews", reviewData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể tạo đánh giá"));
  }
};

export const getMenuItemReviews = async (menuItemId, params = {}) => {
  try {
    const response = await apiClient.get(
      `/customer/reviews/menu-item/${menuItemId}`,
      { params },
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể tải đánh giá"));
  }
};

export const getReviewableItems = async (orderId) => {
  try {
    const response = await getApiExecutor().get(
      `/customer/reviews/order/${orderId}/can-review`,
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể kiểm tra đánh giá"));
  }
};

export const updateReview = async (reviewId, reviewData) => {
  try {
    const response = await customerApi.put(
      `/customer/reviews/${reviewId}`,
      reviewData,
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể cập nhật đánh giá"));
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const response = await customerApi.delete(`/customer/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Không thể xoá đánh giá"));
  }
};
