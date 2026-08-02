import Customer from "../../models/customer.js";
import VerifiedEmail from "../../models/verifiedEmail.js";
import OTPService from "../otp.service.js";
import emailService from "../email.service.js";

export const verifyEmailOTP = async (customerId, email, otp, auth_method = "email") => {
  const customer = await Customer.findOne({
    where: {
      uid: customerId,
      email,
      auth_method,
    },
  });

  if (!customer) {
    throw new Error("Không tìm thấy tài khoản");
  }

  const verificationRecord = await VerifiedEmail.findOne({
    where: {
      customer_uid: customerId,
      email,
      auth_method,
      is_verified: false,
    },
    order: [["created_at", "DESC"]],
  });

  if (!verificationRecord) {
    throw new Error("Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới.");
  }

  if (verificationRecord.otp_expires < new Date()) {
    throw new Error("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
  }

  if (verificationRecord.otp_code !== otp) {
    throw new Error("Mã OTP không đúng");
  }

  verificationRecord.is_verified = true;
  verificationRecord.verified_at = new Date();
  verificationRecord.otp_code = null;
  verificationRecord.otp_expires = null;
  await verificationRecord.save();

  await emailService.sendVerificationSuccessEmail(email, customer.username);

  return {
    success: true,
    customer: {
      uid: customer.uid,
      username: customer.username,
      email: customer.email,
      isEmailVerified: true,
    },
  };
};

export const resendOTP = async (customerId, email) => {
  const customer = await Customer.findOne({
    where: {
      uid: customerId,
      email,
    },
  });

  if (!customer) {
    throw new Error("Không tìm thấy tài khoản");
  }

  const isVerified = await VerifiedEmail.findOne({
    where: {
      customer_uid: customerId,
      email,
      is_verified: true,
    },
  });

  if (isVerified) {
    throw new Error("Email này đã được xác thực rồi.");
  }

  const otp = OTPService.generateOTP();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

  await VerifiedEmail.create({
    customer_uid: customerId,
    email,
    otp_code: otp,
    otp_expires: otpExpires,
    is_verified: false,
  });

  await emailService.sendOTPEmail(email, otp, customer.username);

  return {
    success: true,
    otpExpires,
    message: "Đã gửi lại mã OTP",
  };
};
