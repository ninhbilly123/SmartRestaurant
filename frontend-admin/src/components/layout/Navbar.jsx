import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuth, getAuthPayload, getDefaultRouteForRole } from "../../utils/auth";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // --- 1. LẤY THÔNG TIN USER ---
  const authPayload = getAuthPayload();
  const role = authPayload?.role;
  const displayName =
    authPayload?.fullName || authPayload?.username || role || "Người dùng";
  const getRoleLabel = (roleName) => {
    const labels = {
      super_admin: "Siêu quản trị",
      admin: "Quản trị viên",
      waiter: "Phục vụ",
      kitchen: "Bếp",
    };
    return labels[roleName] || roleName;
  };

  // --- 2. HÀM ĐĂNG XUẤT ---
  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const isMenuActive = () => {
    return location.pathname.startsWith("/admin/menu");
  };

  // Logic logo: Bếp về bếp, Phục vụ về phục vụ, Admin về bàn
  const getLogoLink = () => {
    return getDefaultRouteForRole(role) || "/login";
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-30 h-16">
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link to={getLogoLink()} className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Smart Restaurant
                </h1>
                <p className="text-xs text-gray-600">Hệ thống quản lý</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              
              {/* 1. TABLES LINK (Chỉ Admin và Waiter cần xem bàn) */}
              {(role === "admin" || role === "waiter") && (
                <Link
                  to="/tables"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive("/tables")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Bàn
                  </span>
                </Link>
              )}

              {/* 2. MENU DROPDOWN (Chỉ Admin mới được sửa Menu) */}
              {role === "admin" && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      isMenuActive()
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Thực đơn
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        menuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                      <Link
                        to="/admin/menu/categories"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                      >
                        Danh mục
                      </Link>
                      <Link
                        to="/admin/menu/items"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Món ăn
                      </Link>
                      <Link
                        to="/admin/menu/modifiers"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                      >
                        Tùy chọn
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {(role === "admin") && (
                <Link
                  to="/admin/reports"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive("/admin/reports")
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {/* Icon Bar Chart */}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Báo cáo
                  </span>
                </Link>
              )}

              {/* 3. SUPER ADMIN LINK */}
              {role === "super_admin" && (
                <Link
                  to="/admin/users"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive("/admin/users")
                      ? "bg-purple-50 text-purple-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    Quản lý Admin
                  </span>
                </Link>
              )}

              {/* 4. ADMIN LINK (Nhân viên) */}
              {role === "admin" && (
                <Link
                  to="/admin/employees"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive("/admin/employees")
                      ? "bg-green-50 text-green-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Nhân viên
                  </span>
                </Link>
              )}

              {/* 5. KITCHEN LINK (CHỈ ROLE KITCHEN THẤY) */}
              {role === "kitchen" && (
                <Link
                  to="/kitchen"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive("/kitchen")
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">🍳</span>
                    Bếp
                  </span>
                </Link>
              )}

              {/* 6. WAITER LINK (CHỈ ROLE WAITER THẤY) - Thêm mới */}
              {role === "waiter" && (
                <Link
                  to="/waiter"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive("/waiter")
                      ? "bg-purple-50 text-purple-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">🛎️</span>
                    Phục vụ
                  </span>
                </Link>
              )}

              {/* User Info & Logout */}
              <div className="flex items-center gap-3 border-l pl-4 ml-2">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-bold text-gray-800">
                    {displayName}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">
                    {getRoleLabel(role)}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
