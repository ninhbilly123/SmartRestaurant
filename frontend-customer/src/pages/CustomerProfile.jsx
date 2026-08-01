import React from "react";
import useCustomerProfile from "../hooks/useCustomerProfile";

const CustomerProfile = () => {
  const {
    authMethod,
    changingPassword,
    customer,
    deletingAvatar,
    editData,
    fileInputRef,
    fromPath,
    getInitial,
    handleAvatarChange,
    handleAvatarClick,
    handleCancel,
    handleChangePasswordSubmit,
    handleDeleteAvatar,
    handleInputChange,
    handleLogout,
    handlePasswordChange,
    handlePasswordPopupClose,
    handleSave,
    handleShowChangePassword,
    isEditing,
    loading,
    navigate,
    passwordData,
    passwordErrors,
    saving,
    setIsEditing,
    setShowDeleteConfirm,
    showChangePassword,
    showDeleteConfirm,
    uploadingAvatar,
  } = useCustomerProfile();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-orange-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Sticky Header với nút hành động */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(fromPath)} 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 active:scale-95 transition-all duration-200 shadow-sm hover:shadow border border-gray-200/50 group"
            aria-label="Quay lại"
          >
            <svg className="w-5 h-5 group-active:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="font-bold text-lg text-gray-900 tracking-tight">
            {isEditing ? "Chỉnh sửa hồ sơ" : "Hồ sơ của tôi"}
          </h1>
          
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm rounded-xl hover:from-orange-600 hover:to-orange-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg shadow-orange-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Chỉnh sửa
            </button>
          ) : (
            <div className="flex gap-3">
              <button 
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:from-gray-100 hover:to-gray-200 active:scale-95 transition-all duration-200 border border-gray-300/50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Hủy
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm rounded-xl hover:from-emerald-600 hover:to-emerald-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang lưu
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 mt-6">
        {/* Profile Card với avatar clickable */}
        <div className="relative bg-gradient-to-br from-white via-white to-orange-50 rounded-3xl p-8 shadow-lg border border-orange-100 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-100/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-50/30 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Avatar với nút xóa */}
            <div className="relative group">
              {/* Avatar container */}
              <div className="relative cursor-pointer" onClick={handleAvatarClick}>
                <div className="w-28 h-28 bg-gradient-to-tr from-orange-500 via-orange-400 to-amber-500 rounded-full p-[3px] shadow-2xl shadow-orange-200/50">
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center border-4 border-white overflow-hidden">
                    {customer?.avatar ? (
                      <img 
                        src={customer.avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback khi ảnh lỗi
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          const initialSpan = document.createElement('span');
                          initialSpan.className = 'text-white text-4xl font-black';
                          initialSpan.textContent = getInitial();
                          e.target.parentElement.appendChild(initialSpan);
                        }}
                      />
                    ) : (
                      <span className="text-white text-4xl font-black">
                        {getInitial()}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Upload overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-center">
                    <div className="bg-white/90 rounded-full p-3 mb-2">
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-white text-xs font-semibold">Đổi ảnh</p>
                  </div>
                </div>
                
                {/* Loading indicator khi đang upload */}
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
              
              {/* Nút xóa avatar (chỉ hiện khi có avatar) */}
              {customer?.avatar && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="absolute -top-2 -left-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 active:scale-95 transition-all duration-200 border-2 border-white z-20"
                  title="Xóa ảnh đại diện"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              
              {/* Badge user */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-200 border-2 border-white">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Auth Method Badge */}
              {authMethod === "google" && (
                <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-lg border border-gray-200">
                  <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-orange-400 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {customer?.username || "Khách hàng"}
              </h2>
              <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full border border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ID:
                </span>
                <span className="text-sm font-mono font-bold text-gray-700">
                  {customer?.uid?.substring(0, 8)}...
                </span>
                {authMethod === "google" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-50 to-orange-50 text-red-600 text-xs font-semibold rounded-full border border-red-200">
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    </svg>
                    Google
                  </span>
                )}
              </div>
              {/* Hint text cho avatar */}
              <p className="text-xs text-gray-400 mt-3">
                {customer?.avatar 
                  ? "👆 Click để đổi ảnh, 🗑️ để xóa"
                  : "👆 Click để thêm ảnh đại diện"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Thông tin tài khoản */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold text-gray-700 tracking-wide">
              Thông tin tài khoản
            </h3>
            {isEditing && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-50 to-amber-50 rounded-full border border-orange-200">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-orange-600">Đang chỉnh sửa</span>
              </span>
            )}
          </div>
          
          <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
            {/* Username Field */}
            <div className="p-5 hover:bg-gray-50/50 transition-colors duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                    Tên đăng nhập
                  </p>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        name="username"
                        value={editData.username || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 font-medium"
                        placeholder="Nhập tên đăng nhập"
                        disabled={saving}
                      />
                      {editData.username && editData.username.length < 3 && (
                        <p className="absolute -bottom-6 left-0 text-xs text-red-500 mt-1">
                          Tối thiểu 3 ký tự
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900 font-semibold text-base">
                      {customer?.username || "Chưa cập nhật"}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mx-6 border-t border-gray-100"></div>
            
            {/* Phone Field */}
            <div className="p-5 hover:bg-gray-50/50 transition-colors duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                    Số điện thoại
                  </p>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={editData.phone || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 font-medium"
                        placeholder="Nhập số điện thoại (10 số)"
                        disabled={saving}
                        maxLength="10"
                      />
                      {editData.phone && editData.phone.length !== 10 && (
                        <p className="absolute -bottom-6 left-0 text-xs text-red-500 mt-1">
                          Phải có đúng 10 chữ số
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900 font-semibold text-base">
                      {customer?.phone || "Chưa cập nhật"}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mx-6 border-t border-gray-100"></div>
            
            {/* Email Field (Read Only) */}
            <div className="p-5 hover:bg-gray-50/50 transition-colors duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center text-purple-500 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                        Địa chỉ Email
                      </p>
                      <p className="text-gray-900 font-semibold text-base">
                        {customer?.email || "Chưa cập nhật"}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                      Chỉ đọc
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Email được sử dụng để đăng nhập và không thể thay đổi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-bold text-gray-700 tracking-wide px-2">
            Tùy chọn tài khoản
          </h3>
          
          <div className="space-y-3">
            {/* Change Password Button */}
            <button
              onClick={handleShowChangePassword}
              className="w-full group"
              disabled={saving || isEditing || authMethod === "google"}
            >
              <div className={`rounded-2xl p-5 shadow-md border transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                authMethod === "google" 
                  ? "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                  : "bg-white border-gray-100 hover:shadow-lg hover:border-blue-200 hover:bg-gradient-to-r hover:from-white hover:to-blue-50/30"
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300 ${
                    authMethod === "google"
                      ? "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400"
                      : "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-500"
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-semibold text-base transition-colors ${
                      authMethod === "google" ? "text-gray-500" : "text-gray-900 group-hover:text-blue-600"
                    }`}>
                      Đổi mật khẩu
                    </p>
                    <p className={`text-sm mt-0.5 ${
                      authMethod === "google" ? "text-gray-400" : "text-gray-500"
                    }`}>
                      {authMethod === "google" 
                        ? "Tài khoản Google không cần đổi mật khẩu" 
                        : "Cập nhật mật khẩu mới cho tài khoản"}
                    </p>
                  </div>
                  {authMethod === "google" ? (
                    <div className="text-gray-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="text-gray-300 group-hover:text-blue-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </button>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full group"
              disabled={saving}
            >
              <div className="bg-gradient-to-r from-red-50 to-red-50/50 rounded-2xl p-5 shadow-md border border-red-100 hover:shadow-lg hover:border-red-200 hover:from-red-50 hover:to-red-100/50 transition-all duration-300 active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center text-red-500 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-red-600 font-semibold text-base group-hover:text-red-700 transition-colors">
                      Đăng xuất
                    </p>
                    <p className="text-sm text-red-500/80 mt-0.5">
                      Thoát khỏi tài khoản hiện tại
                    </p>
                  </div>
                  <div className="text-red-300 group-hover:text-red-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400">
            Tài khoản được tạo vào {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : '---'}
            {authMethod === "google" && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-50 to-orange-50 text-red-600 text-xs font-semibold rounded-full border border-red-200">
                <svg className="w-3 h-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                </svg>
                Đăng nhập bằng Google
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Popup đổi mật khẩu */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={handlePasswordPopupClose}
          ></div>
          
          {/* Popup Container */}
          <div className="relative w-full max-w-md bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-2xl border border-gray-200 animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h3>
                    <p className="text-sm text-gray-500">Cập nhật mật khẩu mới cho tài khoản</p>
                  </div>
                </div>
                <button
                  onClick={handlePasswordPopupClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 ${passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 font-medium`}
                    placeholder="Nhập mật khẩu hiện tại"
                    disabled={changingPassword}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="absolute -bottom-5 left-0 text-xs text-red-500 mt-1">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 ${passwordErrors.newPassword ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 font-medium`}
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                    disabled={changingPassword}
                  />
                  {passwordErrors.newPassword && (
                    <p className="absolute -bottom-5 left-0 text-xs text-red-500 mt-1">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 ${passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 font-medium`}
                    placeholder="Nhập lại mật khẩu mới"
                    disabled={changingPassword}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="absolute -bottom-5 left-0 text-xs text-red-500 mt-1">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={handlePasswordPopupClose}
                  disabled={changingPassword}
                  className="flex-1 px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 font-semibold rounded-xl hover:from-gray-100 hover:to-gray-200 active:scale-95 transition-all duration-200 border border-gray-300/50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleChangePasswordSubmit}
                  disabled={changingPassword}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Xác nhận đổi mật khẩu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup xác nhận xóa avatar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !deletingAvatar && setShowDeleteConfirm(false)}
          ></div>
          
          {/* Popup Container */}
          <div className="relative w-full max-w-sm bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-2xl border border-gray-200 animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Xóa ảnh đại diện</h3>
                    <p className="text-sm text-gray-500">Bạn có chắc chắn muốn xóa?</p>
                  </div>
                </div>
                <button
                  onClick={() => !deletingAvatar && setShowDeleteConfirm(false)}
                  disabled={deletingAvatar}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {getInitial()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Ảnh đại diện sẽ được thay thế bằng chữ cái đầu tên bạn. Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deletingAvatar}
                  className="flex-1 px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 font-semibold rounded-xl hover:from-gray-100 hover:to-gray-200 active:scale-95 transition-all duration-200 border border-gray-300/50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteAvatar}
                  disabled={deletingAvatar}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingAvatar ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xác nhận xóa
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;

