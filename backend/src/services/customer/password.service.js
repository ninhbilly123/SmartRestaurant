import crypto from "crypto";
import { Op, Transaction } from "sequelize";
import logger from "../../config/logger.js";
import sequelize from "../../config/database.js";
import Customer from "../../models/customer.js";
import VerifiedEmail from "../../models/verifiedEmail.js";
import OTPService from "../otp.service.js";
import emailService from "../email.service.js";

const RESET_OTP_EXPIRES_MS = 2 * 60 * 1000;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const findEmailCustomer = async (email, options = {}) => {
  const customer = await Customer.findOne({
    where: { email: normalizeEmail(email), auth_method: "email" },
    ...options,
  });

  if (!customer) {
    throw createError("Email chua duoc dang ky", 404);
  }

  return customer;
};

const findActiveResetRecord = async (email, credential, options = {}) => {
  const normalizedEmail = normalizeEmail(email);
  const hashedCredential = OTPService.hashCredential(credential);
  const credentials = [credential, hashedCredential].filter(Boolean);

  return VerifiedEmail.findOne({
    where: {
      email: normalizedEmail,
      auth_method: "email",
      otp_expires: { [Op.gt]: new Date() },
      [Op.or]: [
        { otp_code: { [Op.in]: credentials } },
        { verification_token: { [Op.in]: credentials } },
      ],
    },
    order: [["created_at", "DESC"]],
    ...options,
  });
};

export const sendForgotPasswordOTP = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  try {
    const customer = await findEmailCustomer(normalizedEmail);
    const otp = OTPService.generateOTP();
    const otpExpires = new Date(Date.now() + RESET_OTP_EXPIRES_MS);

    let verificationRecord = await VerifiedEmail.findOne({
      where: {
        customer_uid: customer.uid,
        email: normalizedEmail,
        auth_method: "email",
      },
      order: [["created_at", "DESC"]],
    });

    if (!verificationRecord) {
      verificationRecord = await VerifiedEmail.create({
        customer_uid: customer.uid,
        email: normalizedEmail,
        auth_method: "email",
        is_verified: false,
      });
    }

    await verificationRecord.update({
      otp_code: OTPService.hashCredential(otp),
      otp_expires: otpExpires,
      verification_token: null,
    });

    await emailService.sendOTPEmail(normalizedEmail, otp, customer.username);

    return {
      success: true,
      message: "Ma OTP da duoc gui den email cua ban",
      email: normalizedEmail,
      otpExpires,
    };
  } catch (error) {
    logger.error("Send forgot password OTP error:", error);
    throw error;
  }
};

export const verifyForgotPasswordOTP = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);

  try {
    await findEmailCustomer(normalizedEmail);

    const verificationRecord = await findActiveResetRecord(normalizedEmail, otp);
    if (!verificationRecord) {
      throw createError("Ma OTP khong hop le hoac da het han");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    await verificationRecord.update({
      verification_token: OTPService.hashCredential(resetToken),
    });

    return {
      success: true,
      message: "Xac thuc OTP thanh cong",
      email: normalizedEmail,
      resetToken,
    };
  } catch (error) {
    logger.error("Verify forgot password OTP error:", error);
    throw error;
  }
};

export const resetPasswordWithoutOld = async (
  email,
  newPassword,
  credential,
) => {
  const normalizedEmail = normalizeEmail(email);

  if (!credential) {
    throw createError("Can co OTP hoac reset token de dat lai mat khau");
  }

  const transaction = await sequelize.transaction();

  try {
    const customer = await findEmailCustomer(normalizedEmail, {
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    const verificationRecord = await findActiveResetRecord(
      normalizedEmail,
      credential,
      {
        transaction,
        lock: Transaction.LOCK.UPDATE,
      },
    );

    if (!verificationRecord) {
      throw createError("Ma OTP hoac reset token khong hop le");
    }

    await customer.update({ password: newPassword }, { transaction });
    await verificationRecord.update(
      {
        otp_code: null,
        otp_expires: null,
        verification_token: null,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      success: true,
      message: "Dat lai mat khau thanh cong",
    };
  } catch (error) {
    await transaction.rollback();
    logger.error("Reset password without old error:", error);
    throw error;
  }
};

export const changePassword = async (uid, oldPassword, newPassword) => {
  try {
    const customer = await Customer.findByPk(uid);
    if (!customer) throw createError("Khong tim thay tai khoan", 404);

    const isValid = await customer.comparePassword(oldPassword);
    if (!isValid) {
      throw createError("Mat khau cu khong dung");
    }

    if (oldPassword === newPassword) {
      throw createError("Mat khau moi khong duoc trung voi mat khau cu");
    }

    if (newPassword.length < 6) {
      throw createError("Mat khau moi phai co it nhat 6 ky tu");
    }

    customer.password = newPassword;
    await customer.save();

    return {
      success: true,
      message: "Doi mat khau thanh cong",
    };
  } catch (error) {
    logger.error("Change password error:", error);
    throw error;
  }
};
