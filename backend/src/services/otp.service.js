import VerifiedEmail from "../models/verifiedEmail.js";
import Customer from "../models/customer.js";
import emailService from "./email.service.js";
import logger from "../config/logger.js";

class OTPService {
  // HÀM TẠO OTP 6 SỐ - THÊM VÀO ĐÂY
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Xác thực OTP
  async verifyOTP(customerUid, email, otpCode) {
    try {
      // Tìm OTP record mới nhất
      const verificationRecord = await VerifiedEmail.findOne({
        where: {
          customer_uid: customerUid,
          email: email,
          is_verified: false
        },
        order: [['created_at', 'DESC']]
      });

      if (!verificationRecord) {
        throw new Error("Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới.");
      }

      // Kiểm tra OTP hết hạn
      if (verificationRecord.otp_expires < new Date()) {
        await verificationRecord.destroy(); // Xóa OTP hết hạn
        throw new Error("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
      }

      // Kiểm tra OTP có đúng không
      if (verificationRecord.otp_code !== otpCode) {
        // Đếm số lần thử sai (có thể thêm logic rate limiting)
        throw new Error("Mã OTP không đúng");
      }

      // Xác thực thành công
      verificationRecord.is_verified = true;
      verificationRecord.verified_at = new Date();
      verificationRecord.otp_code = null;
      verificationRecord.otp_expires = null;
      await verificationRecord.save();

      // Lấy thông tin customer
      const customer = await Customer.findOne({
        where: { uid: customerUid, email: email },
        attributes: { exclude: ['password'] }
      });

      // Gửi email thông báo thành công
      await emailService.sendVerificationSuccessEmail(email, customer.username);

      return {
        success: true,
        customer: customer,
        verifiedAt: verificationRecord.verified_at
      };
    } catch (error) {
      console.error("Verify OTP error:", error);
      throw error;
    }
  }

  // Gửi lại OTP
  async resendOTP(customerUid, email) {
    try {
      // Lấy thông tin customer
      const customer = await Customer.findOne({
        where: { uid: customerUid, email: email }
      });

      if (!customer) {
        throw new Error("Không tìm thấy tài khoản");
      }

      const otp = this.generateOTP();
      const otpExpires = new Date(Date.now() + 2 * 60 * 1000); 

      const verificationRecord = await VerifiedEmail.findOne({
        where: {
          customer_uid: customerUid,
          email: email,
          is_verified: false
        },
        order: [['created_at', 'DESC']]
      });

      verificationRecord.otp_code = otp;
      verificationRecord.otp_expires = otpExpires;
      await verificationRecord.save();

      // Gửi email
      await emailService.sendOTPEmail(email, otp, customer.username);

      return {
        success: true,
        otpExpires: otpExpires,
        message: "Đã gửi lại mã OTP"
      };
    } catch (error) {
      console.error("Resend OTP error:", error);
      throw error;
    }
  }

  // Kiểm tra trạng thái verification
  async checkVerificationStatus(customerUid, email, auth_method ='email') {
    try {
      const verificationRecord = await VerifiedEmail.findOne({
        where: {
          customer_uid: customerUid,
          email: email,
          auth_method : auth_method,
          is_verified: true
        },
        order: [['verified_at', 'DESC']]
      });

      return {
        isVerified: !!verificationRecord,
        verifiedAt: verificationRecord?.verified_at || null,
        customerUid: customerUid,
        email: email
      };
    } catch (error) {
      console.error("Check verification error:", error);
      throw error;
    }
  }

  // Dọn dẹp OTP hết hạn (cron job)
  async cleanupExpiredOTPs() {
    try {
      const result = await VerifiedEmail.destroy({
        where: {
          is_verified: false,
          otp_expires: {
            $lt: new Date()
          }
        }
      });

      logger.info(`Đã xóa ${result} OTP hết hạn`);
      return result;
    } catch (error) {
      console.error("Cleanup OTPs error:", error);
      throw error;
    }
  }

  // Lấy OTP còn hiệu lực
  async getActiveOTP(customerUid, email) {
    try {
      const verificationRecord = await VerifiedEmail.findOne({
        where: {
          customer_uid: customerUid,
          email: email,
          is_verified: false,
          otp_expires: {
            $gt: new Date()
          }
        },
        order: [['created_at', 'DESC']]
      });

      if (!verificationRecord) {
        return null;
      }

      return {
        id: verificationRecord.id,
        otpCode: verificationRecord.otp_code,
        expiresAt: verificationRecord.otp_expires,
        createdAt: verificationRecord.created_at,
        timeLeft: Math.max(0, Math.floor((verificationRecord.otp_expires - new Date()) / 1000))
      };
    } catch (error) {
      console.error("Get active OTP error:", error);
      throw error;
    }
  }
}

export default new OTPService();
