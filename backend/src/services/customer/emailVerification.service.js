import Customer from "../../models/customer.js";
import VerifiedEmail from "../../models/verifiedEmail.js";
import OTPService, { OTP_EXPIRES_IN_MS } from "../otp.service.js";
import emailService from "../email.service.js";

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const verifyEmailOTP = async (
  customerId,
  email,
  otp,
  authMethod = "email",
) => {
  const customer = await Customer.findOne({
    where: {
      uid: customerId,
      email,
      auth_method: authMethod,
    },
  });

  if (!customer) {
    throw createError("Khong tim thay tai khoan", 404);
  }

  const verificationRecord = await VerifiedEmail.findOne({
    where: {
      customer_uid: customerId,
      email,
      auth_method: authMethod,
      is_verified: false,
    },
    order: [["created_at", "DESC"]],
  });

  if (!verificationRecord) {
    throw createError("Khong tim thay ma OTP. Vui long yeu cau ma moi.");
  }

  if (!verificationRecord.otp_expires || verificationRecord.otp_expires < new Date()) {
    throw createError("Ma OTP da het han. Vui long yeu cau ma moi.");
  }

  if (!OTPService.isCredentialMatch(verificationRecord.otp_code, otp)) {
    throw createError("Ma OTP khong dung");
  }

  await verificationRecord.update({
    is_verified: true,
    verified_at: new Date(),
    otp_code: null,
    otp_expires: null,
    verification_token: null,
  });

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

export const resendOTP = async (customerId, email, authMethod = "email") => {
  const customer = await Customer.findOne({
    where: {
      uid: customerId,
      email,
      auth_method: authMethod,
    },
  });

  if (!customer) {
    throw createError("Khong tim thay tai khoan", 404);
  }

  const isVerified = await VerifiedEmail.findOne({
    where: {
      customer_uid: customerId,
      email,
      auth_method: authMethod,
      is_verified: true,
    },
  });

  if (isVerified) {
    throw createError("Email nay da duoc xac thuc roi.");
  }

  const otp = OTPService.generateOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRES_IN_MS);

  await VerifiedEmail.destroy({
    where: {
      customer_uid: customerId,
      email,
      auth_method: authMethod,
      is_verified: false,
    },
  });

  await VerifiedEmail.create({
    customer_uid: customerId,
    email,
    auth_method: authMethod,
    otp_code: OTPService.hashCredential(otp),
    otp_expires: otpExpires,
    is_verified: false,
  });

  await emailService.sendOTPEmail(email, otp, customer.username);

  return {
    success: true,
    otpExpires,
    message: "Da gui lai ma OTP",
  };
};
