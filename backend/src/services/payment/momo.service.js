import axios from "axios";
import crypto from "crypto";
import env from "../../config/env.js";

const PARTNER_CODE = "MOMO";

const sign = (rawSignature) =>
  crypto
    .createHmac("sha256", env.momo.secretKey)
    .update(rawSignature)
    .digest("hex");

const safeCompare = (left, right) => {
  if (!left || !right) return false;

  const leftBuffer = Buffer.from(String(left), "hex");
  const rightBuffer = Buffer.from(String(right), "hex");
  if (leftBuffer.length !== rightBuffer.length) return false;

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const assertMomoConfigured = () => {
  if (!env.momo.accessKey || !env.momo.secretKey) {
    throw new Error("Thieu cau hinh MoMo");
  }
};

const callbackRawSignature = (payload) =>
  [
    `accessKey=${env.momo.accessKey}`,
    `amount=${payload.amount ?? ""}`,
    `extraData=${payload.extraData ?? ""}`,
    `message=${payload.message ?? ""}`,
    `orderId=${payload.orderId ?? ""}`,
    `orderInfo=${payload.orderInfo ?? ""}`,
    `orderType=${payload.orderType ?? ""}`,
    `partnerCode=${payload.partnerCode ?? ""}`,
    `payType=${payload.payType ?? ""}`,
    `requestId=${payload.requestId ?? ""}`,
    `responseTime=${payload.responseTime ?? ""}`,
    `resultCode=${payload.resultCode ?? ""}`,
    `transId=${payload.transId ?? ""}`,
  ].join("&");

export const verifyMomoCallbackSignature = (payload) => {
  assertMomoConfigured();

  if (payload.partnerCode && payload.partnerCode !== PARTNER_CODE) {
    return false;
  }

  const expectedSignature = sign(callbackRawSignature(payload));
  return safeCompare(expectedSignature, payload.signature);
};

export const createMomoPayment = async ({ order }) => {
  assertMomoConfigured();

  const customerOrderId = order.id;
  const orderInfo = `Thanh toan don hang #${customerOrderId.slice(-6).toUpperCase()}`;
  const redirectUrl = `${env.cors.frontendUrl}/customer/orders/${customerOrderId}`;
  const ipnUrl = env.momo.ipnUrl || `${env.cors.backendUrl}/api/customer/payment/callback`;
  const requestType = "payWithMethod";
  const orderTotal = Number(order.total_amount);
  if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
    throw new Error("Tong tien don hang khong hop le");
  }

  const amount = String(Math.max(1000, Math.round(orderTotal)));
  const momoOrderId = `${PARTNER_CODE}_${customerOrderId.slice(-8)}_${Date.now()}`;
  const requestId = momoOrderId;
  const extraData = Buffer.from(JSON.stringify({ customerOrderId })).toString("base64");

  const rawSignature = [
    `accessKey=${env.momo.accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${momoOrderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${PARTNER_CODE}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join("&");

  const requestBody = {
    partnerCode: PARTNER_CODE,
    partnerName: "SmartRestaurant",
    storeId: "SmartRestaurant",
    requestId,
    amount,
    orderId: momoOrderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    requestType,
    autoCapture: true,
    extraData,
    orderGroupId: "",
    signature: sign(rawSignature),
  };

  const result = await axios.post(`${env.momo.endpoint}/create`, requestBody, {
    headers: { "Content-Type": "application/json" },
  });

  return result.data;
};

export const queryMomoPaymentStatus = async (orderId) => {
  assertMomoConfigured();

  const rawSignature = [
    `accessKey=${env.momo.accessKey}`,
    `orderId=${orderId}`,
    `partnerCode=${PARTNER_CODE}`,
    `requestId=${orderId}`,
  ].join("&");

  const result = await axios.post(
    `${env.momo.endpoint}/query`,
    {
      partnerCode: PARTNER_CODE,
      requestId: orderId,
      orderId,
      signature: sign(rawSignature),
      lang: "vi",
    },
    { headers: { "Content-Type": "application/json" } },
  );

  return result.data;
};
