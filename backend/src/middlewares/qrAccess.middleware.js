import QRService from "../services/qr.service.js";
import Table from "../models/table.js";
import logger from "../config/logger.js";

export const getRequestTableId = (req) =>
  req.headers["x-table-id"] ||
  req.params.tableId ||
  req.query.table ||
  req.query.table_id ||
  req.body?.table_id;

export const getRequestQRToken = (req) =>
  req.headers["x-qr-token"] ||
  req.query.token ||
  req.body?.qr_token ||
  req.body?.token;

export const verifyTableAccessToken = async (tableId, token) => {
  if (!tableId || !token) {
    return {
      ok: false,
      status: 401,
      message: "Thiếu thông tin bàn hoặc QR token",
    };
  }

  let decoded;
  try {
    decoded = QRService.verifyToken(token);
  } catch (error) {
    return {
      ok: false,
      status: 401,
      message: "Mã QR không hợp lệ hoặc đã hết hạn",
    };
  }

  if (String(decoded.tableId) !== String(tableId)) {
    return {
      ok: false,
      status: 403,
      message: "QR token không khớp với bàn",
    };
  }

  const table = await Table.findByPk(tableId);
  if (!table) {
    return {
      ok: false,
      status: 404,
      message: "Không tìm thấy bàn",
    };
  }

  if (table.status !== "active") {
    return {
      ok: false,
      status: 403,
      message: "Bàn hiện không hoạt động",
    };
  }

  if (table.qr_token !== token) {
    logger.warn(`[SECURITY] Old QR token used for table ${table.table_number}`);

    return {
      ok: false,
      status: 401,
      message: "Mã QR cũ không còn hiệu lực",
    };
  }

  return {
    ok: true,
    decoded,
    table,
  };
};
