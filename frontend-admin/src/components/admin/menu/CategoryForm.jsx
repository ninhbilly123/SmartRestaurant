import React, { useState, useEffect } from "react";
import Modal from "../../common/Modal";
import Button from "../../common/Button";
import Input from "../../common/Input";
import Alert from "../../common/Alert";
import { categoryService } from "../../../services/menu";

const CategoryForm = ({ isOpen, onClose, onSuccess, category }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    display_order: 0,
    status: "active",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        display_order: category.display_order || 0,
        status: category.status || "active",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        display_order: 0,
        status: "active",
      });
    }
    setErrors({});
    setApiError(null);
  }, [category, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên danh mục là bắt buộc";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Tên danh mục phải có ít nhất 2 ký tự";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Tên danh mục không được vượt quá 50 ký tự";
    }

    if (formData.description && formData.description.length > 800) {
      newErrors.description = "Mô tả không được vượt quá 800 ký tự";
    }

    if (formData.display_order < 0) {
      newErrors.display_order = "Thứ tự hiển thị không được âm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value, 10) || 0 : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setApiError(null);

    // Trim name before sending
    const submitData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
    };

    try {
      if (isEditing) {
        await categoryService.updateCategory(category.id, submitData);
      } else {
        await categoryService.createCategory(submitData);
      }
      onSuccess();
    } catch (err) {
      setApiError(err.message || "Không thể lưu danh mục");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {apiError && (
          <Alert
            type="error"
            message={apiError}
            onClose={() => setApiError(null)}
          />
        )}

        <Input
          label="Tên danh mục"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="VD: Khai vị, Món chính, Đồ uống"
          error={errors.name}
          required
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả ngắn gọn về danh mục này..."
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <Input
          label="Thứ tự hiển thị"
          name="display_order"
          type="number"
          value={formData.display_order}
          onChange={handleChange}
          placeholder="0"
          error={errors.display_order}
          min={0}
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trạng thái
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="status"
                value="active"
                checked={formData.status === "active"}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Hoạt động</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="status"
                value="inactive"
                checked={formData.status === "inactive"}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Tạm ngừng</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Đang lưu...
              </span>
            ) : isEditing ? (
              "Cập nhật danh mục"
            ) : (
              "Tạo danh mục"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryForm;
