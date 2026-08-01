import React, { useCallback } from "react";
import { Edit, Lock, Unlock, UserPlus, Save, X, ChefHat, Coffee } from "lucide-react";
import {
  EMPLOYEE_DEFAULT_FORM,
  EMPLOYEE_ROLES,
  getRoleLabel,
} from "../../constants/roles";
import useUserManagement from "../../hooks/useUserManagement";

const EMPLOYEE_FORM_LABELS = {
  createSuccess: "Tạo nhân viên mới thành công!",
  updateSuccess: "Cập nhật nhân viên thành công!",
  error: "Lỗi xử lý",
  toggleConfirmPrefix: "Bạn muốn",
  toggleError: "Lỗi",
};

const EmployeeManagement = () => {
  const filterEmployees = useCallback(
    (users) => users.filter((user) => EMPLOYEE_ROLES.includes(user.role)),
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
    defaultFormData: EMPLOYEE_DEFAULT_FORM,
    filterUsers: filterEmployees,
    labels: EMPLOYEE_FORM_LABELS,
  });

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Quản lý Nhân viên
                </h1>
                <p className="text-gray-600 mt-1">
                  Quản lý nhân viên phục vụ và bếp
                </p>
              </div>
            </div>
            <button 
              onClick={toggleForm} 
              className={`${
                showForm 
                  ? 'bg-gray-500 hover:bg-gray-600' 
                  : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700'
              } text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 transition-all transform hover:scale-105`}
            >
              {showForm ? <><X size={18}/> Đóng</> : <><UserPlus size={18}/> Thêm Nhân viên</>}
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <p className="text-teal-100 text-sm font-medium">Tổng Nhân viên</p>
              <svg className="w-8 h-8 text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold">{users.length}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100 text-sm font-medium">Phục vụ</p>
              <Coffee className="w-8 h-8 text-blue-200" />
            </div>
            <p className="text-4xl font-bold">{users.filter(u => u.role === 'waiter').length}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <p className="text-orange-100 text-sm font-medium">Bếp</p>
              <ChefHat className="w-8 h-8 text-orange-200" />
            </div>
            <p className="text-4xl font-bold">{users.filter(u => u.role === 'kitchen').length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-100 text-sm font-medium">Đang hoạt động</p>
              <svg className="w-8 h-8 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold">{users.filter(u => u.is_active).length}</p>
          </div>
        </div>

        {/* FORM */}
        {showForm && (
          <div className="bg-white p-8 rounded-2xl shadow-lg mb-6 border border-teal-100 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-teal-100 rounded-lg">
                {isEditing ? <Edit size={20} className="text-teal-600"/> : <UserPlus size={20} className="text-teal-600"/>}
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {isEditing ? "Cập nhật nhân viên" : "Thông tin nhân viên mới"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên đăng nhập</label>
                <input 
                  className={`w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                    isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'hover:border-gray-300'
                  }`}
                  placeholder="username123" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange} 
                  disabled={isEditing}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mật khẩu {isEditing && <span className="text-xs font-normal text-red-500">(Để trống nếu không đổi)</span>}
                </label>
                <input 
                  type="password" 
                  className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-gray-300 transition-all"
                  placeholder={isEditing ? "Nhập mật khẩu mới..." : "********"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!isEditing} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
                <input 
                  className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-gray-300 transition-all" 
                  placeholder="Nguyễn Văn A"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vai trò</label>
                <select 
                  className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white hover:border-gray-300 transition-all"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="waiter">☕ Phục vụ</option>
                  <option value="kitchen">👨‍🍳 Bếp</option>
                </select>
              </div>
              
              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <Save size={18}/> Lưu lại
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-teal-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Họ tên</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tên đăng nhập</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vai trò</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u, index) => (
                  <tr key={u.id} className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-transparent transition-all">
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{u.full_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700">
                        {u.username}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${
                        u.role === 'kitchen' 
                          ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {u.role === 'kitchen' ? <ChefHat size={14}/> : <Coffee size={14}/>}
                        {getRoleLabel(u.role).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-green-700 font-bold text-xs bg-green-100 px-3 py-1.5 rounded-lg border border-green-200">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-700 font-bold text-xs bg-red-100 px-3 py-1.5 rounded-lg border border-red-200">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Đã khóa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(u)} 
                          className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all hover:scale-110" 
                          title="Sửa"
                        >
                          <Edit size={16}/>
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(u)} 
                          className={`p-2.5 rounded-lg transition-all hover:scale-110 ${
                            u.is_active 
                              ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                              : 'text-green-600 bg-green-50 hover:bg-green-100'
                          }`}
                          title={u.is_active ? "Khóa" : "Mở khóa"}
                        >
                          {u.is_active ? <Lock size={16}/> : <Unlock size={16}/>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
