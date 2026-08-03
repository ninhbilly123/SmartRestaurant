import React from "react";
import { Edit, Save, UserPlus } from "lucide-react";

const UserForm = ({
  formData,
  isEditing,
  onCancel,
  onChange,
  onSubmit,
  passwordPlaceholder,
  roleOptions,
  submitLabel,
  theme = "blue",
  title,
}) => {
  const isTeal = theme === "teal";
  const containerClass = isTeal
    ? "bg-white p-8 rounded-2xl shadow-lg mb-6 border border-teal-100 animate-fade-in"
    : "bg-white p-6 rounded-xl shadow-lg mb-8 border border-blue-100 animate-fade-in";
  const inputClass = isTeal
    ? "w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-gray-300 transition-all"
    : "w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500";
  const disabledInputClass = isTeal
    ? "bg-gray-50 text-gray-500 cursor-not-allowed"
    : "bg-gray-100 text-gray-500";
  const formClass = isTeal
    ? "grid grid-cols-1 md:grid-cols-2 gap-6"
    : "grid grid-cols-1 md:grid-cols-3 gap-4";
  const actionsClass = isTeal
    ? "md:col-span-2 flex justify-end gap-3 mt-4"
    : "md:col-span-3 flex justify-end mt-2 gap-3";
  const submitClass = isTeal
    ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition-all transform hover:scale-105"
    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow hover:shadow-lg flex items-center gap-2";

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${isTeal ? "bg-teal-100" : "bg-blue-100"}`}>
          {isEditing ? (
            <Edit size={20} className={isTeal ? "text-teal-600" : "text-blue-700"} />
          ) : (
            <UserPlus size={20} className={isTeal ? "text-teal-600" : "text-blue-700"} />
          )}
        </div>
        <h3 className={`text-xl font-bold ${isTeal ? "text-gray-800" : "text-blue-800"}`}>
          {title}
        </h3>
      </div>

      <form onSubmit={onSubmit} className={formClass}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tên đăng nhập
          </label>
          <input
            className={`${inputClass} ${isEditing ? disabledInputClass : ""}`}
            disabled={isEditing}
            name="username"
            onChange={onChange}
            placeholder="username123"
            required
            value={formData.username}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Mật khẩu{" "}
            {isEditing && (
              <span className="text-xs font-normal text-red-500">
                (Để trống nếu không đổi)
              </span>
            )}
          </label>
          <input
            className={inputClass}
            name="password"
            onChange={onChange}
            placeholder={passwordPlaceholder}
            required={!isEditing}
            type="password"
            value={formData.password}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Họ và tên
          </label>
          <input
            className={inputClass}
            name="full_name"
            onChange={onChange}
            placeholder="Nguyễn Văn A"
            required
            value={formData.full_name}
          />
        </div>

        {roleOptions?.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Vai trò
            </label>
            <select
              className={`${inputClass} bg-white`}
              name="role"
              onChange={onChange}
              value={formData.role}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={actionsClass}>
          <button
            className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-all"
            onClick={onCancel}
            type="button"
          >
            Hủy
          </button>
          <button className={submitClass} type="submit">
            <Save size={18} /> {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
