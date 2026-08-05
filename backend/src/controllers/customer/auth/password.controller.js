import customerService from "../../../services/customer.service.js";
import customerValidator from "../../../validators/customer.validator.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Vui long nhap email",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Email khong hop le",
      });
    }

    const result = await customerService.sendForgotPasswordOTP(email);

    return res.json({
      success: true,
      message: result.message || "Ma OTP da duoc gui den email cua ban",
      data: {
        email: result.email,
        otpExpires: result.otpExpires,
      },
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      error: error.message || "Khong the gui OTP",
    });
  }
};

export const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Vui long nhap email va ma OTP",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: "Ma OTP phai gom 6 chu so",
      });
    }

    const result = await customerService.verifyForgotPasswordOTP(email, otp);

    return res.json({
      success: true,
      message: result.message || "Xac thuc OTP thanh cong",
      data: {
        email: result.email,
        resetToken: result.resetToken,
      },
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      error: error.message || "Xac thuc OTP that bai",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, resetToken, newPassword, confirmPassword } = req.body;

    if (!email || (!otp && !resetToken) || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Vui long nhap day du thong tin",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Mat khau phai co it nhat 6 ky tu",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Mat khau xac nhan khong khop",
      });
    }

    const result = await customerService.resetPasswordWithoutOld(
      email,
      newPassword,
      resetToken || otp,
    );

    return res.json({
      success: true,
      message:
        result.message ||
        "Dat lai mat khau thanh cong. Vui long dang nhap bang mat khau moi.",
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      error: error.message || "Khong the dat lai mat khau",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const uid = req.customer?.uid || req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: "Khong tim thay thong tin nguoi dung",
      });
    }

    const { error } = customerValidator.changePassword.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { oldPassword, newPassword } = req.body;
    const result = await customerService.changePassword(uid, oldPassword, newPassword);

    return res.status(200).json({
      success: true,
      message: result.message || "Doi mat khau thanh cong",
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      error: error.message,
    });
  }
};

export const sendOtpResetPassword = async (req, res) => {
  return sendForgotPasswordOTP(req, res);
};
