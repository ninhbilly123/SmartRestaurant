import otpService from "../../../services/otp.service.js";
import customerService from "../../../services/customer.service.js";

export const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Thiếu email",
      });
    }

    const result = await customerService.checkEmailExists(email);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Lỗi khi kiểm tra email",
    });
  }
};

export const verifyEmailOTP = async (req, res) => {
  try {
    const { customerId, email, otp } = req.body;

    if (!customerId || !email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin xác thực",
      });
    }

    const result = await otpService.verifyOTP(customerId, email, otp);

    return res.json({
      success: true,
      message: "Xác thực email thành công!",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message || "Xác thực thất bại",
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { customerId, email } = req.body;

    if (!customerId || !email) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin",
      });
    }

    const result = await otpService.resendOTP(customerId, email);

    return res.json({
      success: true,
      message: result.message || "Đã gửi lại mã OTP",
      data: {
        otpExpires: result.otpExpires,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message || "Không thể gửi lại OTP",
    });
  }
};
