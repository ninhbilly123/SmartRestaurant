import React, { useState } from "react";
import { X, Printer, Send, Calculator } from "lucide-react";
import { printBill } from "../../utils/billPrint";

const BillConfirmModal = ({ isOpen, onClose, order, onConfirm }) => {
  // State quản lý các khoản tiền
  const [discountType, setDiscountType] = useState("percent"); // 'percent' | 'fixed'
  const [discountValue, setDiscountValue] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0); // Thuế theo %
  const [note, setNote] = useState("");

  const resetBillState = () => {
    setDiscountType("percent");
    setDiscountValue(0);
    setTaxPercent(0);
    setNote("");
  };

  if (!isOpen || !order) return null;
  
  // 2. Tính toán Subtotal (Tổng tiền món chưa giảm)
  const calculateSubtotal = () => {
    if (!order.items) return 0;
    return order.items.reduce((acc, item) => {
      if (item.status === 'cancelled') return acc;
      // Cộng giá gốc
      let price = parseFloat(item.menu_item?.price || 0);
      // Cộng giá modifier (nếu có)
      if (item.modifiers) {
        item.modifiers.forEach(mod => {
            price += parseFloat(mod.modifier_option?.price_adjustment || 0);
        });
      }
      return acc + (price * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();

  // 3. Tính toán Giảm giá (Xử lý an toàn NaN)
  const calculateDiscount = () => {
    const val = parseFloat(discountValue || 0);
    if (discountType === 'percent') {
        // Giới hạn max 100%
        const safePercent = val > 100 ? 100 : val; 
        return (subtotal * safePercent) / 100;
    }
    return val;
  };

  const discountAmount = calculateDiscount();
  
  // 4. Tính thuế từ phần trăm (tax_amount = (subtotal - discount) * taxPercent%)
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (subtotalAfterDiscount * parseFloat(taxPercent || 0)) / 100;
  
  // 5. Tổng cuối (Chặn số âm)
  const finalTotal = Math.max(0, subtotalAfterDiscount + taxAmount);

  // Xử lý Gửi (Confirm)
  const handleConfirm = () => {
    const billData = {
        discount_type: discountType,
        discount_value: parseFloat(discountValue || 0),
        tax_amount: taxAmount, // Gửi số tiền thuế đã tính, không phải %
        note: note,
    };
    onConfirm(order.id, billData);
    resetBillState();
  };

  const handleClose = () => {
    resetBillState();
    onClose();
  };

  const handlePrint = () => {
    try {
      printBill({
        discountAmount,
        discountType,
        discountValue,
        finalTotal,
        note,
        order,
        subtotal,
        taxAmount,
        taxPercent,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold flex items-center gap-2">
            <Calculator size={20}/> Xác nhận hóa đơn - Bàn {order.table?.table_number}
          </h3>
          <button onClick={handleClose} className="hover:bg-blue-700 p-1 rounded"><X size={20}/></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
            {/* Summary List */}
            <div className="bg-gray-50 p-3 rounded text-sm max-h-40 overflow-y-auto border">
                {order.items?.map((item, idx) => {
                    if (item.status === 'cancelled') return null;
                    
                    const basePrice = parseFloat(item.menu_item?.price || 0);
                    const modifiersTotal = (item.modifiers || []).reduce((sum, mod) => {
                        return sum + parseFloat(mod.price || mod.modifier_option?.price_adjustment || 0);
                    }, 0);
                    const itemTotal = (basePrice + modifiersTotal) * item.quantity;
                    
                    return (
                        <div key={idx} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                            <div className="flex justify-between">
                                <span className="font-medium">{item.quantity}x {item.menu_item?.name}</span>
                                <span className="font-bold">{itemTotal.toLocaleString()}</span>
                            </div>
                            {item.modifiers && item.modifiers.length > 0 && (
                                <div className="ml-4 text-xs text-gray-500 italic mt-1">
                                    {item.modifiers.map((mod, midx) => {
                                        const modPrice = parseFloat(mod.price || mod.modifier_option?.price_adjustment || 0);
                                        return (
                                            <div key={midx}>
                                                + {mod.modifier_option?.name || mod.name}
                                                {modPrice > 0 && ` (+${modPrice.toLocaleString()})`}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {item.notes && (
                                <div className="ml-4 text-xs text-orange-600 italic mt-1">
                                    Ghi chú: {item.notes}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Loại giảm giá</label>
                    <select 
                        value={discountType} 
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="percent">Phần trăm (%)</option>
                        <option value="fixed">Tiền mặt (VNĐ)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Giá trị giảm</label>
                    <input 
                        type="number" 
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full border p-2 rounded font-bold text-red-600 focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="0"
                        min="0"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                    Thuế (%)
                </label>
                <input 
                    type="number" 
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    className="w-full border p-2 rounded font-bold text-green-600 focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="0 (VD: 10 = 10%)"
                    min="0"
                    max="100"
                    step="0.1"
                />
                {taxPercent > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                        ≈ {taxAmount.toLocaleString()} VNĐ
                    </div>
                )}
            </div>

            <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ghi chú hóa đơn</label>
                 <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="2"
                    placeholder="VD: Khách VIP, Voucher..."
                 ></textarea>
            </div>

            {/* Final Total Display */}
            <div className="border-t pt-4 space-y-1">
                <div className="flex justify-between text-sm text-gray-500">
                    <span>Tạm tính:</span>
                    <span>{subtotal.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-sm text-red-500">
                    <span>Giảm giá:</span>
                    <span>-{discountAmount.toLocaleString()} đ</span>
                </div>
                 <div className="flex justify-between text-sm text-gray-500">
                    <span>Thuế {taxPercent > 0 && `(${taxPercent}%)`}:</span>
                    <span>+{taxAmount.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-blue-800 mt-2 border-t border-dashed pt-2">
                    <span>TỔNG CỘNG:</span>
                    <span>{finalTotal.toLocaleString()} đ</span>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t flex gap-3">
            <button 
                onClick={handlePrint}
                className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
            >
                <Printer size={18}/> In Phiếu
            </button>
            <button 
                onClick={handleConfirm}
                className="flex-[2] bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 shadow flex items-center justify-center gap-2 transition-colors"
            >
                <Send size={18}/> Gửi Khách Hàng
            </button>
        </div>
      </div>
    </div>
  );
};

export default BillConfirmModal;
