const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");

const getModifierPrice = (modifier) =>
  parseFloat(
    modifier.price ?? modifier.modifier_option?.price_adjustment ?? 0,
  );

const buildItemRows = (items = []) =>
  items
    .filter((item) => item.status !== "cancelled")
    .map((item) => {
      const basePrice = parseFloat(item.menu_item?.price || 0);
      const modifiersTotal = (item.modifiers || []).reduce(
        (sum, modifier) => sum + getModifierPrice(modifier),
        0,
      );
      const itemTotal = (basePrice + modifiersTotal) * item.quantity;

      const modifierRows = (item.modifiers || [])
        .map((modifier) => {
          const price = getModifierPrice(modifier);
          const name = modifier.modifier_option?.name || modifier.name;
          return `
            <div class="line child">
              <span>+ ${escapeHtml(name)}</span>
              <span>${price > 0 ? `+${formatNumber(price)}` : ""}</span>
            </div>
          `;
        })
        .join("");

      const noteRow = item.notes
        ? `<div class="note">Ghi chú: ${escapeHtml(item.notes)}</div>`
        : "";

      return `
        <div class="line">
          <span class="bold">${escapeHtml(item.quantity)}x ${escapeHtml(item.menu_item?.name)}</span>
          <span>${formatNumber(itemTotal)}</span>
        </div>
        ${modifierRows}
        ${noteRow}
      `;
    })
    .join("");

const buildBillHtml = ({
  discountAmount,
  discountType,
  discountValue,
  finalTotal,
  note,
  order,
  subtotal,
  taxAmount,
  taxPercent,
}) => `
  <html>
    <head>
      <title>Hóa đơn</title>
      <style>
        body { font-family: monospace; padding: 20px; }
        .center { text-align: center; }
        .line { display: flex; justify-content: space-between; margin-bottom: 5px; gap: 12px; }
        .child { margin-left: 20px; font-size: 0.85em; color: #666; }
        .bold { font-weight: bold; }
        .note { margin-left: 20px; font-size: 0.8em; font-style: italic; color: #f97316; }
        hr { border: 0; border-top: 1px dashed #000; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="center">
        <h2>SMART RESTAURANT</h2>
        <p>ĐC: 123 ABC, Thành phố XYZ</p>
      </div>
      <hr />
      <div class="line"><span>Bàn:</span><span class="bold">${escapeHtml(order.table?.table_number)}</span></div>
      <div class="line"><span>Ngày:</span><span>${new Date().toLocaleString("vi-VN")}</span></div>
      <hr />
      ${buildItemRows(order.items)}
      <hr />
      <div class="line"><span>Tạm tính:</span><span>${formatNumber(subtotal)}</span></div>
      ${
        discountAmount > 0
          ? `<div class="line"><span>Giảm giá (${
              discountType === "percent"
                ? `${escapeHtml(discountValue)}%`
                : "Số tiền"
            }):</span><span>-${formatNumber(discountAmount)}</span></div>`
          : ""
      }
      ${
        taxAmount > 0
          ? `<div class="line"><span>Thuế (${escapeHtml(taxPercent)}%):</span><span>+${formatNumber(taxAmount)}</span></div>`
          : ""
      }
      <hr />
      <div class="line" style="font-size: 1.2em">
        <span class="bold">TỔNG CỘNG:</span>
        <span class="bold">${formatNumber(finalTotal)} đ</span>
      </div>
      ${note ? `<br /><div style="font-style:italic;font-size:0.8em">Ghi chú: ${escapeHtml(note)}</div>` : ""}
      <br />
      <div class="center">Cảm ơn quý khách!</div>
    </body>
  </html>
`;

export const printBill = (billData) => {
  const printWindow = window.open("", "", "height=600,width=400");

  if (!printWindow) {
    throw new Error("Trình duyệt đã chặn cửa sổ in hóa đơn.");
  }

  printWindow.document.open();
  printWindow.document.write(buildBillHtml(billData));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
