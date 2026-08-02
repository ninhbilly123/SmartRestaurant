import customerService from "../../../services/customer.service.js";
import customerValidator from "../../../validators/customer.validator.js";

export const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng nhập email",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Email không hợp lệ",
      });
    }

    const result = await customerService.sendForgotPasswordOTP(email);

    return res.json({
      success: true,
      message: result.message || "Mã OTP đã được gửi đến email của bạn",
      data: {
        email: result.email,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message || "Không thể gửi OTP",
    });
  }
};

export const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng nhập email và mã OTP",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: "Mã OTP phải gồm 6 chữ số",
      });
    }

    const result = await customerService.verifyForgotPasswordOTP(email, otp);

    return res.json({
      success: true,
      message: result.message || "Xác thực OTP thành công",
      data: {
        email: result.email,
        resetToken: Buffer.from(`${email}:${otp}:${Date.now()}`).toString("base64"),
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message || "Xác thực OTP thất bại",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng nhập đầy đủ thông tin",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Mật khẩu xác nhận không khớp",
      });
    }

    try {
      await customerService.verifyForgotPasswordOTP(email, otp);
    } catch (otpError) {
      return res.status(400).json({
        success: false,
        error: "Mã OTP không hợp lệ hoặc đã hết hạn",
      });
    }

    const result = await customerService.resetPasswordWithoutOld(email, newPassword);

    return res.json({
      success: true,
      message: result.message || "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message || "Không thể đặt lại mật khẩu",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const uid = req.customer?.uid || req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: "Không tìm thấy thông tin người dùng",
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
      message: result.message || "Đổi mật khẩu thành công",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const sendOtpResetPassword = async (req, res) => {
  return sendForgotPasswordOTP(req, res);
};
