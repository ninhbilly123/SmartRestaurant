import React, { useCallback } from "react";
import { Edit, Lock, Unlock, UserPlus, Save, X } from "lucide-react";
import {
  ADMIN_DEFAULT_FORM,
  getRoleLabel,
} from "../../constants/roles";
import useUserManagement from "../../hooks/useUserManagement";

const ADMIN_FORM_LABELS = {
  createSuccess: "Tạo tài khoản Admin thành công!",
  updateSuccess: "Cập nhật thông tin thành công!",
  error: "Đã có lỗi xảy ra",
  toggleConfirmPrefix: "Bạn có chắc muốn",
  toggleError: "Lỗi cập nhật trạng thái",
};

const UserManagement = () => {
  const filterAdminUsers = useCallback(
    (users) => users.filter((user) => ["admin", "super_admin"].includes(user.role)),
    [],
  );

  const {
    formData,
    handleChange,
    handleEditClick,
    handleSubmit,
    handleToggleStatus,
    isEditing,
    loading,
    resetForm,
    showForm,
    toggleForm,
    users,
  } = useUserManagement({
    defaultFormData: ADMIN_DEFAULT_FORM,
    filterUsers: filterAdminUsers,
    labels: ADMIN_FORM_LABELS,
  });

  return (
    <div className="p-6 font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Admin</h1>
          <p className="text-sm text-gray-500">Quản lý, chỉnh sửa và phân quyền quản trị viên</p>
        </div>
        <button
          onClick={toggleForm}
          className={`${showForm ? 'bg-gray-500' : 'bg-blue-600'} text-white px-4 py-2 rounded shadow hover:opacity-90 flex items-center gap-2 transition-all`}
        >
          {showForm ? <><X size={18}/> Đóng</> : <><UserPlus size={18}/> Tạo Admin Mới</>}
        </button>
      </div>

      {/* FORM (TẠO MỚI HOẶC SỬA) */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-blue-100 animate-fade-in">
          <h3 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2">
            {isEditing ? <Edit size={20}/> : <UserPlus size={20}/>}
            {isEditing ? "Cập nhật thông tin Admin" : "Cấp tài khoản Admin mới"}
          </h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tên đăng nhập</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={isEditing}
                className={`w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${isEditing ? 'bg-gray-100 text-gray-500' : ''}`}
                placeholder="VD: admin_quan1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Mật khẩu {isEditing && <span className="text-xs font-normal text-red-500">(Để trống nếu không đổi)</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={isEditing ? "Nhập mật khẩu mới..." : "********"}
                required={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Họ tên hiển thị</label>
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: Nguyễn Văn A"
                required
              />
            </div>
            
            <div className="md:col-span-3 flex justify-end mt-2 gap-3">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
              <button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow hover:shadow-lg flex items-center gap-2">
                <Save size={18}/> {isEditing ? "Lưu thay đổi" : "Xác nhận tạo"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DANH SÁCH USER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="p-4 border-b">STT</th>
              <th className="p-4 border-b">Thông tin</th>
              <th className="p-4 border-b">Tên đăng nhập</th>
              <th className="p-4 border-b">Vai trò</th>
              <th className="p-4 border-b">Trạng thái</th>
              <th className="p-4 border-b text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500"><div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div> Đang tải...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">Chưa có dữ liệu.</td></tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="p-4 text-gray-500 font-mono">{index + 1}</td>
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-400">ID: {user.id}</p>
                  </td>
                  <td className="p-4 font-mono text-blue-600 text-sm">{user.username}</td>
                  <td className="p-4">
                    <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-1 rounded-full font-bold uppercase border border-purple-200">
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-bold border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-bold border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Đã khóa
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors tooltip"
                        title="Sửa thông tin"
                      >
                        <Edit size={18} />
                      </button>

                      <button 
                        onClick={() => handleToggleStatus(user)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.is_active 
                            ? "text-red-600 bg-red-50 hover:bg-red-100" 
                            : "text-green-600 bg-green-50 hover:bg-green-100"
                        }`}
                        title={user.is_active ? "Khóa tài khoản" : "Mở khóa"}
                      >
                        {user.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
