const TABLE_ID_KEY = "current_table_id";
const QR_TOKEN_KEY = "current_qr_token";
const ORDER_ID_KEY = "current_order_id";

export const saveTableSession = (tableId, token) => {
  if (tableId) {
    localStorage.setItem(TABLE_ID_KEY, tableId);
  }

  if (token) {
    localStorage.setItem(QR_TOKEN_KEY, token);
  }
};

export const getTableSession = () => ({
  tableId: localStorage.getItem(TABLE_ID_KEY),
  token: localStorage.getItem(QR_TOKEN_KEY),
});

export const savePaymentSession = (tableId, orderId) => {
  if (tableId) {
    localStorage.setItem(TABLE_ID_KEY, tableId);
  }

  if (orderId) {
    localStorage.setItem(ORDER_ID_KEY, orderId);
  }
};
