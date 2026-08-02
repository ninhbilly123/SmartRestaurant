import jwt from "jsonwebtoken";
import Customer from "../../models/customer.js";
import VerifiedEmail from "../../models/verifiedEmail.js";
import OTPService from "../otp.service.js";
import emailService from "../email.service.js";
import env from "../../config/env.js";
import logger from "../../config/logger.js";

export const generateAccessToken = (customer) =>
  jwt.sign(
    {
      uid: customer.uid,
      username: customer.username,
      email: customer.email,
      role: "customer",
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.secret);
  } catch (error) {
    throw new Error("Token không hợp lệ");
  }
};

export const register = async (username, email, password, auth_method) => {
  const existAccount = await Customer.findOne({
    where: { email, auth_method },
  });

  if (existAccount) {
    throw new Error("Email đã được sử dụng");
  }

  const customer = await Customer.create({ username, email, password, auth_method });

  try {
    const otp = OTPService.generateOTP();
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000);

    await VerifiedEmail.create({
      customer_uid: customer.uid,
      email: customer.email,
      auth_method: customer.auth_method,
      otp_code: otp,
      otp_expires: otpExpires,
      is_verified: false,
    });

    await emailService.sendOTPEmail(email, otp, username);
  } catch (emailError) {
    logger.error("Không thể gửi email OTP:", emailError);
    if (env.isProduction) {
      throw new Error("Không thể gửi email xác thực. Vui lòng thử lại sau.");
    }
  }

  return {
    customer,
    accessToken: generateAccessToken(customer),
    needsVerification: true,
    message: "Đăng ký thành công. Vui lòng kiểm tra email để xác thực.",
  };
};

export const syncGoogleUser = async (username, email, auth_method) => {
  try {
    let customer = await Customer.findOne({
      where: {
        email: email.toLowerCase(),
        auth_method,
      },
    });

    if (!customer) {
      const tempPassword = `google_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

      customer = await Customer.create({
        username: username || email.split("@")[0],
        password: tempPassword,
        email: email.toLowerCase(),
        auth_method,
      });

      try {
        await VerifiedEmail.create({
          customer_uid: customer.uid,
          email: customer.email,
          auth_method: customer.auth_method,
          otp_code: null,
          otp_expires: null,
          is_verified: true,
        });
      } catch (verifiedEmailError) {
        logger.error("VerifiedEmail creation error:", verifiedEmailError);
      }
    }

    return {
      customer,
      accessToken: generateAccessToken(customer),
    };
  } catch (error) {
    logger.error("syncGoogleUser error:", {
      error: error.message,
      errors: error.errors,
      input: { username, email, auth_method },
    });
    throw error;
  }
};

export const login = async (email, password, auth_method = "email") => {
  const customer = await Customer.findOne({
    where: {
      email,
      auth_method,
    },
  });

  if (!customer) {
    throw new Error("Email chưa được đăng ký");
  }

  const isValid = await customer.comparePassword(password);
  if (!isValid) {
    throw new Error("Sai mật khẩu hoặc email");
  }

  const verifiedEmail = await VerifiedEmail.findOne({
    where: {
      customer_uid: customer.uid,
      email: customer.email,
      auth_method: customer.auth_method,
      is_verified: true,
    },
  });

  if (!verifiedEmail) {
    const activeOTP = await VerifiedEmail.findOne({
      where: {
        customer_uid: customer.uid,
        email: customer.email,
        auth_method: customer.auth_method,
        is_verified: false,
      },
    });

    if (activeOTP) {
      await activeOTP.destroy();
    }

    const otp = OTPService.generateOTP();
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000);

    await VerifiedEmail.create({
      customer_uid: customer.uid,
      email: customer.email,
      auth_method: customer.auth_method,
      otp_code: otp,
      otp_expires: otpExpires,
      is_verified: false,
    });

    await emailService.sendOTPEmail(customer.email, otp, customer.username);
    throw new Error("EMAIL_NOT_VERIFIED");
  }

  return {
    customer,
    accessToken: generateAccessToken(customer),
    isEmailVerified: true,
  };
};

export const checkEmailExists = async (email, auth_method = "email") => {
  const customer = await Customer.findOne({
    where: {
      email,
      auth_method,
    },
  });

  return {
    exists: !!customer,
    email,
  };
};
