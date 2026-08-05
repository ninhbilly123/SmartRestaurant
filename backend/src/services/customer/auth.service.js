import jwt from "jsonwebtoken";
import env from "../../config/env.js";
import logger from "../../config/logger.js";
import sequelize from "../../config/database.js";
import Customer from "../../models/customer.js";
import VerifiedEmail from "../../models/verifiedEmail.js";
import OTPService, { OTP_EXPIRES_IN_MS } from "../otp.service.js";
import emailService from "../email.service.js";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const assertGoogleConfigured = () => {
  if (!env.google.clientId) {
    throw createError("Thieu cau hinh GOOGLE_CLIENT_ID", 500);
  }
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createError(payload.error_description || payload.error || "Google token khong hop le", 401);
  }

  return payload;
};

const assertGoogleAudience = (payload) => {
  const audience = payload.aud || payload.audience || payload.issued_to;
  if (audience !== env.google.clientId) {
    throw createError("Google token khong dung ung dung", 401);
  }
};

const buildGoogleProfile = (payload) => {
  const email = normalizeEmail(payload.email);
  if (!email) {
    throw createError("Google token khong co email", 401);
  }

  if (
    payload.email_verified !== undefined &&
    payload.email_verified !== true &&
    payload.email_verified !== "true"
  ) {
    throw createError("Email Google chua duoc xac thuc", 401);
  }

  return {
    email,
    username: payload.name || payload.given_name || email.split("@")[0],
    avatar: payload.picture || null,
  };
};

const verifyGoogleIdToken = async (idToken) => {
  const tokenInfoUrl = `${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`;
  const payload = await fetchJson(tokenInfoUrl);
  assertGoogleAudience(payload);
  return buildGoogleProfile(payload);
};

const verifyGoogleAccessToken = async (accessToken) => {
  const tokenInfoUrl = `${GOOGLE_TOKENINFO_URL}?access_token=${encodeURIComponent(accessToken)}`;
  const tokenInfo = await fetchJson(tokenInfoUrl);
  assertGoogleAudience(tokenInfo);

  const profile = await fetchJson(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return buildGoogleProfile(profile);
};

const verifyGoogleCredential = async ({
  idToken,
  accessToken,
  expectedEmail,
}) => {
  assertGoogleConfigured();

  if (!idToken && !accessToken) {
    throw createError("Thieu Google token", 400);
  }

  const profile = idToken
    ? await verifyGoogleIdToken(idToken)
    : await verifyGoogleAccessToken(accessToken);

  const normalizedExpectedEmail = normalizeEmail(expectedEmail);
  if (normalizedExpectedEmail && normalizedExpectedEmail !== profile.email) {
    throw createError("Email khong khop voi Google token", 401);
  }

  return profile;
};

const makeUniqueUsername = async (baseUsername, transaction = null) => {
  let base = String(baseUsername || "customer")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 40) || "customer";

  if (base.length < 3) {
    base = `${base}___`.slice(0, 3);
  }

  let username = base;
  let suffix = 1;

  while (
    await Customer.findOne({
      where: { username },
      transaction,
    })
  ) {
    const suffixText = `_${suffix++}`;
    username = `${base.slice(0, 50 - suffixText.length)}${suffixText}`;
  }

  return username;
};

const createVerificationOtp = async (customer, transaction = null) => {
  const otp = OTPService.generateOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRES_IN_MS);

  await VerifiedEmail.destroy({
    where: {
      customer_uid: customer.uid,
      email: customer.email,
      auth_method: customer.auth_method,
      is_verified: false,
    },
    transaction,
  });

  await VerifiedEmail.create(
    {
      customer_uid: customer.uid,
      email: customer.email,
      auth_method: customer.auth_method,
      otp_code: OTPService.hashCredential(otp),
      otp_expires: otpExpires,
      is_verified: false,
    },
    { transaction },
  );

  return { otp, otpExpires };
};

export const generateAccessToken = (customer) =>
  jwt.sign(
    {
      uid: customer.uid,
      username: customer.username,
      email: customer.email,
      role: "customer",
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.secret);
  } catch {
    throw new Error("Token khong hop le");
  }
};

export const register = async (username, email, password, authMethod) => {
  const normalizedEmail = normalizeEmail(email);
  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const existAccount = await Customer.findOne({
      where: { email: normalizedEmail, auth_method: authMethod },
      transaction,
    });

    if (existAccount) {
      throw new Error("Email da duoc su dung");
    }

    const safeUsername = await makeUniqueUsername(username, transaction);
    const customer = await Customer.create(
      {
        username: safeUsername,
        full_name: username,
        email: normalizedEmail,
        password,
        auth_method: authMethod,
      },
      { transaction },
    );

    const { otp } = await createVerificationOtp(customer, transaction);
    await emailService.sendOTPEmail(normalizedEmail, otp, username);

    await transaction.commit();
    committed = true;

    return {
      customer,
      accessToken: null,
      needsVerification: true,
      message: "Dang ky thanh cong. Vui long kiem tra email de xac thuc.",
    };
  } catch (error) {
    if (!committed) {
      await transaction.rollback();
    }
    logger.error("Register customer error:", error);
    throw error;
  }
};

export const syncGoogleUser = async (payloadOrUsername, emailArg, authMethodArg) => {
  const payload =
    typeof payloadOrUsername === "object"
      ? payloadOrUsername
      : {
          username: payloadOrUsername,
          email: emailArg,
          authMethod: authMethodArg,
        };

  const googleProfile = await verifyGoogleCredential({
    idToken: payload.idToken || payload.credential,
    accessToken:
      payload.googleAccessToken ||
      payload.providerToken ||
      payload.google_access_token,
    expectedEmail: payload.email,
  });
  const normalizedEmail = googleProfile.email;
  const authMethod = "google";
  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    let customer = await Customer.findOne({
      where: {
        email: normalizedEmail,
        auth_method: authMethod,
      },
      transaction,
    });

    if (!customer) {
      const safeUsername = await makeUniqueUsername(
        payload.username || googleProfile.username || normalizedEmail.split("@")[0],
        transaction,
      );

      customer = await Customer.create(
        {
          username: safeUsername,
          full_name: googleProfile.username || safeUsername,
          password: null,
          email: normalizedEmail,
          auth_method: authMethod,
          avatar: googleProfile.avatar,
        },
        { transaction },
      );

      await VerifiedEmail.create(
        {
          customer_uid: customer.uid,
          email: customer.email,
          auth_method: customer.auth_method,
          otp_code: null,
          otp_expires: null,
          is_verified: true,
          verified_at: new Date(),
        },
        { transaction },
      );
    } else if (googleProfile.avatar && !customer.avatar) {
      await customer.update({ avatar: googleProfile.avatar }, { transaction });
    }

    await transaction.commit();
    committed = true;

    return {
      customer,
      accessToken: generateAccessToken(customer),
    };
  } catch (error) {
    if (!committed) {
      await transaction.rollback();
    }
    logger.error("syncGoogleUser error:", {
      error: error.message,
      errors: error.errors,
      input: { email: payload.email, authMethod },
    });
    throw error;
  }
};

export const login = async (email, password, authMethod = "email") => {
  const normalizedEmail = normalizeEmail(email);
  const customer = await Customer.findOne({
    where: {
      email: normalizedEmail,
      auth_method: authMethod,
    },
  });

  if (!customer) {
    throw new Error("Email chua duoc dang ky");
  }

  const isValid = await customer.comparePassword(password);
  if (!isValid) {
    throw new Error("Sai mat khau hoac email");
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
    const transaction = await sequelize.transaction();

    try {
      const { otp } = await createVerificationOtp(customer, transaction);
      await emailService.sendOTPEmail(customer.email, otp, customer.username);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    throw new Error("EMAIL_NOT_VERIFIED");
  }

  return {
    customer,
    accessToken: generateAccessToken(customer),
    isEmailVerified: true,
  };
};

export const checkEmailExists = async (email, authMethod = "email") => {
  const customer = await Customer.findOne({
    where: {
      email: normalizeEmail(email),
      auth_method: authMethod,
    },
  });

  return {
    exists: !!customer,
    email: normalizeEmail(email),
  };
};
