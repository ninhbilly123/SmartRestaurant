import dotenv from "dotenv";

dotenv.config({ quiet: true });

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const parseNumber = (value, defaultValue) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const parseList = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const adminFrontendUrl = process.env.ADMIN_FRONTEND_URL || "http://localhost:3001";
const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

const env = {
  nodeEnv,
  isProduction,
  port: parseNumber(process.env.PORT, 5000),

  database: {
    url: process.env.DATABASE_URL || "",
    host: process.env.DB_HOST || "localhost",
    port: parseNumber(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME || "table_management",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "your_password",
    syncAlter: parseBoolean(process.env.DB_SYNC_ALTER, false),
  },

  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    qrExpiresIn: process.env.QR_TOKEN_EXPIRES || "365d",
  },

  cors: {
    frontendUrl,
    adminFrontendUrl,
    backendUrl,
    allowedOrigins: parseList(process.env.CORS_ORIGINS, [
      frontendUrl,
      adminFrontendUrl,
    ]),
  },

  email: {
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseNumber(process.env.EMAIL_PORT, 587),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
  },

  momo: {
    accessKey: process.env.MOMO_ACCESS_KEY || "",
    secretKey: process.env.MOMO_SECRET_KEY || "",
    ipnUrl: process.env.MOMO_IPN_URL || "",
    endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api",
  },
};

export default env;
