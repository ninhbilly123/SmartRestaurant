import React, { useState } from "react";

const ModifierModalContent = ({ item, onClose, onAddToCart }) => {
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState("");

  const modifierGroups = item.modifierGroups || [];

  const handleModifierChange = (
    groupId,
    option,
    isChecked,
    isSingleSelect = false,
  ) => {
    setSelectedModifiers((prev) => {
      // For single select, replace the entire selection
      if (isSingleSelect) {
        if (isChecked) {
          return {
            ...prev,
            [groupId]: [option],
          };
        } else {
          // Allow deselFection for single select
          return {
            ...prev,
            [groupId]: [],
          };
        }
      }

      // For multiple select
      const groupSelections = prev[groupId] || [];

      if (isChecked) {
        return {
          ...prev,
          [groupId]: [...groupSelections, option],
        };
      } else {
        return {
          ...prev,
          [groupId]: groupSelections.filter((o) => o.id !== option.id),
        };
      }
    });
  };

  const isOptionSelected = (groupId, optionId) => {
    return (selectedModifiers[groupId] || []).some((o) => o.id === optionId);
  };

  // Calculate total price with modifiers
  const calculateTotalPrice = () => {
    const basePrice = parseFloat(item.price || 0);
    let modifierTotal = 0;

    Object.values(selectedModifiers).forEach((options) => {
      options.forEach((option) => {
        modifierTotal += parseFloat(option.price_adjustment || 0);
      });
    });

    return (basePrice + modifierTotal) * quantity;
  };

  // Get all selected modifiers as flat array
  const getSelectedModifiersArray = () => {
    const result = [];
    Object.entries(selectedModifiers).forEach(([groupId, options]) => {
      const group = modifierGroups.find((g) => g.id === groupId);
      options.forEach((option) => {
        result.push({
          groupId,
          groupName: group?.name || "",

          // 👇 SỬA LẠI 3 DÒNG NÀY CHO CHUẨN:
          id: option.id, // Thêm 'id' để khớp với CustomerService
          optionId: option.id, // Giữ lại cái này nếu code cũ có dùng

          name: option.name, // Thêm 'name' cho gọn
          optionName: option.name,

          price: parseFloat(option.price_adjustment || 0), // 🔥 QUAN TRỌNG: Đặt tên là 'price'
        });
      });
    });
    return result;
  };

  // Check if required modifiers are selected
  const validateRequiredModifiers = () => {
    for (const group of modifierGroups) {
      if (group.is_required) {
        const selections = selectedModifiers[group.id] || [];
        if (selections.length < (group.min_selections || 1)) {
          return false;
        }
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!validateRequiredModifiers()) {
      setValidationError("Vui lòng chọn đầy đủ tùy chọn bắt buộc");
      return;
    }

    const modifiersArray = getSelectedModifiersArray();
    const modifiersTotalPrice = modifiersArray.reduce(
      (sum, m) => sum + m.price,
      0,
    );

    onAddToCart(item, modifiersArray, quantity, modifiersTotalPrice, note);
    onClose();
  };

  const totalPrice = calculateTotalPrice();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-2xl shadow-2xl z-50 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
              {item.description && (
                <p className="text-gray-600 text-sm mt-1">{item.description}</p>
              )}
              <p className="text-lg font-semibold text-blue-600 mt-2">
                {parseFloat(item.price || 0).toLocaleString("vi-VN")} đ
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Modifier Groups */}
        <div className="flex-1 overflow-y-auto p-4">
          {modifierGroups.length > 0 ? (
            modifierGroups.map((group) => (
              <div key={group.id} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  {group.is_required && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                      Bắt buộc
                    </span>
                  )}
                </div>

                {group.options && group.options.length > 0 ? (
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isOptionSelected(group.id, option.id)
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 hover:border-amber-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type={
                              group.selection_type === "single"
                                ? "radio"
                                : "checkbox"
                            }
                            name={
                              group.selection_type === "single"
                                ? `modifier-group-${group.id}`
                                : undefined
                            }
                            checked={isOptionSelected(group.id, option.id)}
                            onChange={(e) =>
                              handleModifierChange(
                                group.id,
                                option,
                                e.target.checked,
                                group.selection_type === "single",
                              )
                            }
                            className={`w-5 h-5 text-amber-600 focus:ring-amber-500 ${
                              group.selection_type === "single" ? "" : "rounded"
                            }`}
                          />
                          <span className="text-gray-900">{option.name}</span>
                        </div>
                        {parseFloat(option.price_adjustment) > 0 && (
                          <span className="text-gray-600 font-medium">
                            +{" "}
                            {parseFloat(option.price_adjustment).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            đ
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    Chưa có lựa chọn
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              Món này chưa có tùy chọn
            </p>
          )}
        </div>

        {/* Footer with quantity and add to cart */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {/* Special instructions */}
          <div className="mb-4">
            <label className="block font-medium text-gray-900 mb-2">
              Ghi chú đặc biệt (tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Không hành, thêm cay, không đá..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {note.length}/200
            </p>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium text-gray-900">Số lượng</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                -
              </button>
              <span className="px-4 py-2 text-gray-900 font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to cart button */}
          {validationError && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {validationError}
            </div>
          )}

          <button
            onClick={handleAddToCart}
            className="w-full py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>Thêm vào giỏ</span>
            <span className="font-bold">
              {totalPrice.toLocaleString("vi-VN")} đ
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

// Wrapper component that uses key to reset state
const ModifierModal = ({ item, isOpen, onClose, onAddToCart }) => {
  if (!isOpen || !item) return null;

  // Using key={item.id} to reset ModifierModalContent state when item changes
  return (
    <ModifierModalContent
      key={item.id}
      item={item}
      onClose={onClose}
      onAddToCart={onAddToCart}
    />
  );
};

export default ModifierModal;
