import Customer from "../../models/customer.js";
import VerifiedEmail from "../../models/verifiedEmail.js";
import OTPService from "../otp.service.js";
import emailService from "../email.service.js";
import logger from "../../config/logger.js";

export const sendForgotPasswordOTP = async (email) => {
  try {
    const verificationRecord = await VerifiedEmail.findOne({
      where: {
        email,
        auth_method: "email",
      },
      order: [["created_at", "DESC"]],
    });

    if (!verificationRecord) {
      throw new Error("Email chưa được đăng ký");
    }

    const otp = OTPService.generateOTP();
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000);

    verificationRecord.is_verified = true;
    verificationRecord.otp_code = otp;
    verificationRecord.otp_expires = otpExpires;
    await verificationRecord.save();

    await emailService.sendOTPEmail(email, otp, "");

    return {
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn",
      email,
    };
  } catch (error) {
    logger.error("Send forgot password OTP error:", error);
    throw error;
  }
};

export const verifyForgotPasswordOTP = async (email, otp) => {
  try {
    const verificationRecord = await VerifiedEmail.findOne({
      where: {
        email,
        otp_code: otp,
        auth_method: "email",
      },
    });

    if (!verificationRecord) {
      throw new Error("Mã OTP không hợp lệ hoặc đã hết hạn");
    }

    if (verificationRecord.otp_expires < new Date()) {
      throw new Error("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
    }

    return {
      success: true,
      message: "Xác thực OTP thành công",
      email,
    };
  } catch (error) {
    logger.error("Verify forgot password OTP error:", error);
    throw error;
  }
};

export const resetPasswordWithoutOld = async (email, newPassword) => {
  try {
    const customer = await Customer.findOne({
      where: { email, auth_method: "email" },
    });

    if (!customer) {
      throw new Error("Tài khoản không tồn tại");
    }

    await customer.update({ password: newPassword });

    return {
      success: true,
      message: "Đặt lại mật khẩu thành công",
    };
  } catch (error) {
    logger.error("Reset password without old error:", error);
    throw error;
  }
};

export const changePassword = async (uid, oldPassword, newPassword) => {
  try {
    const customer = await Customer.findByPk(uid);
    if (!customer) throw new Error("Không tìm thấy tài khoản");

    const isValid = await customer.comparePassword(oldPassword);
    if (!isValid) {
      throw new Error("Mật khẩu cũ không đúng");
    }

    if (oldPassword === newPassword) {
      throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ");
    }

    if (newPassword.length < 6) {
      throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    customer.password = newPassword;
    await customer.save();

    return {
      success: true,
      message: "Đổi mật khẩu thành công",
    };
  } catch (error) {
    logger.error("Change password error:", error);
    throw error;
  }
};
