import { apiClient } from "../../config/api";
import {
  clearCustomerAuth,
  getCustomerInfo,
  getCustomerToken,
  isCustomerLoggedIn,
  setCustomerSession,
} from "../../utils/customerAuth";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.error || error.response?.data?.message || error.message || fallback;

export const register = async (username, email, password) => {
  try {
    const response = await apiClient.post("/customer/register", {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Đăng ký thất bại"));
  }
};

export const syncGoogleUser = async (userData) => {
  try {
    const response = await apiClient.post("/customer/sync-google", userData);

    if (response.data.success && response.data.data) {
      const { customer, accessToken } = response.data.data;
      setCustomerSession(accessToken, customer, "google");

      return {
        success: true,
        customer,
        accessToken,
        message: response.data.message || "Đăng nhập Google thành công",
      };
    }

    throw new Error(response.data.error || "Đồng bộ Google thất bại");
  } catch (error) {
    throw new Error(getErrorMessage(error, "Đồng bộ Google thất bại"));
  }
};

export const syncSupabaseUser = syncGoogleUser;

export const login = async (email, password) => {
  try {
    const response = await apiClient.post("/customer/login", {
      email,
      password,
    });

    if (response.data.needsVerification) {
      return {
        success: false,
        needsVerification: true,
        customerId: response.data.data?.customerId,
        email: response.data.data?.email,
        phone: response.data.data?.phone,
        username: response.data.data?.username,
        message: response.data.message || "Vui lòng xác thực email",
      };
    }

    if (response.data.success && response.data.data) {
      const { customer, accessToken } = response.data.data;
      setCustomerSession(accessToken, customer, "email");

      return {
        success: true,
        customer,
        accessToken,
        message: response.data.message,
      };
    }

    throw new Error(response.data.error || "Đăng nhập thất bại");
  } catch (error) {
    throw new Error(getErrorMessage(error, "Đăng nhập thất bại"));
  }
};

export const verifyEmailOTP = async (customerId, email, otp) => {
  try {
    const response = await apiClient.post("/customer/verify-email", {
      customerId,
      email,
      otp,
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Xác thực OTP thất bại"),
    };
  }
};

export const resendOTP = async (customerId, email) => {
  try {
    const response = await apiClient.post("/customer/resend-otp", {
      customerId,
      email,
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Không thể gửi lại OTP"),
    };
  }
};

export const checkVerificationStatus = async (customerId, email) => {
  try {
    const response = await apiClient.get("/customer/check-verification", {
      params: { customerId, email },
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Không thể kiểm tra trạng thái xác thực"),
    };
  }
};

export const checkEmailExists = async (email) => {
  try {
    const response = await apiClient.get("/customer/check-email", {
      params: { email },
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Không thể kiểm tra email"),
    };
  }
};

export const sendForgotPasswordOTP = async (email) => {
  try {
    const response = await apiClient.post("/customer/forgot-password/send-otp", {
      email,
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Không thể gửi OTP"),
    };
  }
};

export const verifyForgotPasswordOTP = async (email, otp) => {
  try {
    const response = await apiClient.post("/customer/forgot-password/verify-otp", {
      email,
      otp,
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Xác thực OTP thất bại"),
    };
  }
};

export const resetPassword = async (email, otp, newPassword, confirmPassword) => {
  try {
    const response = await apiClient.post("/customer/forgot-password/reset", {
      email,
      otp,
      newPassword,
      confirmPassword,
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Không thể đặt lại mật khẩu"),
    };
  }
};

export const isLoggedIn = () => isCustomerLoggedIn();

export const getCurrentCustomer = () => {
  try {
    return getCustomerInfo();
  } catch {
    return null;
  }
};

export const getToken = () => getCustomerToken();

export const logout = () => {
  clearCustomerAuth();
};

export const isEmailVerified = async () => {
  try {
    const customer = getCurrentCustomer();
    if (!customer || !customer.uid) return false;

    const response = await checkVerificationStatus(customer.uid, customer.email);
    return response.success && response.data?.isVerified;
  } catch {
    return false;
  }
};

export const refreshToken = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("Không có token");

    const response = await apiClient.post("/customer/refresh-token", { token });

    if (response.data.success && response.data.data?.accessToken) {
      setCustomerSession(response.data.data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};
