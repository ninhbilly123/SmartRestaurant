import crypto from "crypto";
import { Op } from "sequelize";
import env from "../config/env.js";
import logger from "../config/logger.js";
import Customer from "../models/customer.js";
import VerifiedEmail from "../models/verifiedEmail.js";
import emailService from "./email.service.js";

export const OTP_EXPIRES_IN_MS = 2 * 60 * 1000;
const CREDENTIAL_HASH_PREFIX = "hmac-sha256:";

export const hashCredential = (credential) => {
  if (!credential) return null;

  const digest = crypto
    .createHmac("sha256", env.jwt.secret)
    .update(String(credential))
    .digest("hex");

  return `${CREDENTIAL_HASH_PREFIX}${digest}`;
};

export const isCredentialMatch = (storedCredential, rawCredential) => {
  if (!storedCredential || !rawCredential) return false;

  const stored = String(storedCredential);
  const hashed = hashCredential(rawCredential);

  if (stored.startsWith(CREDENTIAL_HASH_PREFIX)) {
    const storedBuffer = Buffer.from(stored);
    const hashedBuffer = Buffer.from(hashed);
    return (
      storedBuffer.length === hashedBuffer.length &&
      crypto.timingSafeEqual(storedBuffer, hashedBuffer)
    );
  }

  return stored === String(rawCredential);
};

class OTPService {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  hashCredential(credential) {
    return hashCredential(credential);
  }

  isCredentialMatch(storedCredential, rawCredential) {
    return isCredentialMatch(storedCredential, rawCredential);
  }

  async verifyOTP(customerUid, email, otpCode, authMethod = "email") {
    try {
      const verificationRecord = await VerifiedEmail.findOne({
        where: {
          customer_uid: customerUid,
          email,
          auth_method: authMethod,
          is_verified: false,
        },
        order: [["created_at", "DESC"]],
      });

      if (!verificationRecord) {
        throw new Error("Khong tim thay ma OTP. Vui long yeu cau ma moi.");
      }

      if (!verificationRecord.otp_expires || verificationRecord.otp_expires < new Date()) {
        await verificationRecord.destroy();
        throw new Error("Ma OTP da het han. Vui long yeu cau ma moi.");
      }

      if (!this.isCredentialMatch(verificationRecord.otp_code, otpCode)) {
        throw new Error("Ma OTP khong dung");
      }

      verificationRecord.is_verified = true;
      verificationRecord.verified_at = new Date();
      verificationRecord.otp_code = null;
      verificationRecord.otp_expires = null;
      verificationRecord.verification_token = null;
      await verificationRecord.save();

      const customer = await Customer.findOne({
        where: { uid: customerUid, email },
        attributes: { exclude: ["password"] },
      });

      if (customer) {
        await emailService.sendVerificationSuccessEmail(email, customer.username);
      }

      return {
        success: true,
        customer,
        verifiedAt: verificationRecord.verified_at,
      };
    } catch (error) {
      logger.error("Verify OTP error:", error);
      throw error;
    }
  }

  async resendOTP(customerUid, email, authMethod = "email") {
    try {
      const customer = await Customer.findOne({
        where: { uid: customerUid, email, auth_method: authMethod },
      });

      if (!customer) {
        throw new Error("Khong tim thay tai khoan");
      }

      const isVerified = await VerifiedEmail.findOne({
        where: {
          customer_uid: customerUid,
          email,
          auth_method: authMethod,
          is_verified: true,
        },
      });

      if (isVerified) {
        throw new Error("Email nay da duoc xac thuc roi.");
      }

      const otp = this.generateOTP();
      const otpExpires = new Date(Date.now() + OTP_EXPIRES_IN_MS);

      let verificationRecord = await VerifiedEmail.findOne({
        where: {
          customer_uid: customerUid,
          email,
          auth_method: authMethod,
          is_verified: false,
        },
        order: [["created_at", "DESC"]],
      });

      if (!verificationRecord) {
        verificationRecord = await VerifiedEmail.create({
          customer_uid: customerUid,
          email,
          auth_method: authMethod,
          is_verified: false,
        });
      }

      await verificationRecord.update({
        otp_code: this.hashCredential(otp),
        otp_expires: otpExpires,
        verification_token: null,
      });

      await emailService.sendOTPEmail(email, otp, customer.username);

      return {
        success: true,
        otpExpires,
        message: "Da gui lai ma OTP",
      };
    } catch (error) {
      logger.error("Resend OTP error:", error);
      throw error;
    }
  }

  async checkVerificationStatus(customerUid, email, authMethod = "email") {
    try {
      const verificationRecord = await VerifiedEmail.findOne({
        where: {
          customer_uid: customerUid,
          email,
          auth_method: authMethod,
          is_verified: true,
        },
        order: [["verified_at", "DESC"]],
      });

      return {
        isVerified: !!verificationRecord,
        verifiedAt: verificationRecord?.verified_at || null,
        customerUid,
        email,
      };
    } catch (error) {
      logger.error("Check verification error:", error);
      throw error;
    }
  }

  async cleanupExpiredOTPs() {
    try {
      const result = await VerifiedEmail.destroy({
        where: {
          is_verified: false,
          otp_expires: {
            [Op.lt]: new Date(),
          },
        },
      });

      logger.info(`Deleted ${result} expired OTP records`);
      return result;
    } catch (error) {
      logger.error("Cleanup OTPs error:", error);
      throw error;
    }
  }

  async getActiveOTP(customerUid, email, authMethod = "email") {
    try {
      const verificationRecord = await VerifiedEmail.findOne({
        where: {
          customer_uid: customerUid,
          email,
          auth_method: authMethod,
          is_verified: false,
          otp_expires: {
            [Op.gt]: new Date(),
          },
        },
        order: [["created_at", "DESC"]],
      });

      if (!verificationRecord) {
        return null;
      }

      return {
        id: verificationRecord.id,
        otpCode: null,
        expiresAt: verificationRecord.otp_expires,
        createdAt: verificationRecord.created_at,
        timeLeft: Math.max(
          0,
          Math.floor((verificationRecord.otp_expires - new Date()) / 1000),
        ),
      };
    } catch (error) {
      logger.error("Get active OTP error:", error);
      throw error;
    }
  }
}

export default new OTPService();
