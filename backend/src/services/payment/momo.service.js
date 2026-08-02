import axios from "axios";
import crypto from "crypto";
import env from "../../config/env.js";

const PARTNER_CODE = "MOMO";

const sign = (rawSignature) =>
  crypto
    .createHmac("sha256", env.momo.secretKey)
    .update(rawSignature)
    .digest("hex");

const assertMomoConfigured = () => {
  if (!env.momo.accessKey || !env.momo.secretKey) {
    throw new Error("Thiếu cấu hình MoMo");
  }
};

export const createMomoPayment = async ({ order }) => {
  assertMomoConfigured();

  const customerOrderId = order.id;
  const orderInfo = `Thanh toan don hang #${customerOrderId.slice(-6).toUpperCase()}`;
  const redirectUrl = `${env.cors.frontendUrl}/customer/orders/${customerOrderId}`;
  const ipnUrl = env.momo.ipnUrl || `${env.cors.backendUrl}/api/customer/payment/callback`;
  const requestType = "payWithMethod";
  const amount = String(Math.max(1000, Math.round(Number(order.total_amount))));
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
    { headers: { "Content-Type": "application/json" } }
  );

  return result.data;
};
