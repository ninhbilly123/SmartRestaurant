import React, { useState } from "react";

const PromptDialog = ({
  cancelText = "Hủy",
  confirmText = "Xác nhận",
  initialValue = "",
  isOpen,
  label,
  message,
  onClose,
  onConfirm,
  placeholder = "",
  title,
}) => {
  const [value, setValue] = useState(initialValue);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            {message && <p className="text-gray-600 mb-4">{message}</p>}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder={placeholder}
              autoFocus
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => onConfirm(value)}
                className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptDialog;
