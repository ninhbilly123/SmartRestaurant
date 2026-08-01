import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  clearCustomerAuth,
  getAuthMethod,
  getCustomerInfo,
} from "../../utils/customerAuth";

const MenuHeader = ({ tableNumber, cartItemCount }) => {
  const [customer, setCustomer] = useState(() => {
    return getCustomerInfo();
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [dropdownAvatarError, setDropdownAvatarError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Hàm tiện ích để tạo state chứa URL hiện tại (bao gồm cả params table/token)
  const navigationState = { from: location.pathname + location.search };

  const handleLogout = () => {
    clearCustomerAuth();
    setCustomer(null);
    setShowDropdown(false);
    // Reload trang để xóa các trạng thái cũ
    window.location.reload();
  };

  // Hàm lấy chữ cái đầu cho avatar
  const getInitial = () => {
    if (!customer) return "";

    if (customer.full_name) {
      return customer.full_name.charAt(0).toUpperCase();
    }
    if (customer.username) {
      return customer.username.charAt(0).toUpperCase();
    }
    if (customer.email) {
      return customer.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Hàm lấy tên hiển thị
  const getDisplayName = () => {
    if (!customer) return "";

    if (customer.full_name) {
      return customer.full_name;
    }
    if (customer.username) {
      return customer.username;
    }
    return customer.email?.split("@")[0] || "Khách hàng";
  };

  // Hàm lấy loại tài khoản
  const getAccountType = () => {
    const authMethod = getAuthMethod();
    if (authMethod === "google") {
      return "Google Account";
    }
    return "Tài khoản email";
  };

  return (
    <header className="bg-linear-to-r from-amber-600 to-orange-600 shadow-lg sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Table {tableNumber}
            </h1>
            <p className="text-amber-100">Welcome to our restaurant</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              {customer ? (
                <>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                  >
                    {/* Hiển thị avatar/icon trên button */}
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-amber-600 font-bold text-sm overflow-hidden">
                      {customer.avatar && !avatarError ? (
                        <img 
                          src={customer.avatar} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <span>{getInitial()}</span>
                      )}
                    </div>
                    <span className="hidden sm:inline">{getDisplayName()}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        showDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <Link
                  to="/customer/login"
                  state={navigationState}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Đăng nhập</span>
                </Link>
              )}

              {showDropdown && customer && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-30 border">
                    <div className="p-4 border-b">
                      <div className="flex items-center space-x-3">
                        {/* Hiển thị avatar trong dropdown */}
                        <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                          {customer.avatar && !dropdownAvatarError ? (
                            <img 
                              src={customer.avatar} 
                              alt="Avatar" 
                              className="w-full h-full object-cover"
                              onError={() => setDropdownAvatarError(true)}
                            />
                          ) : (
                            <span>{getInitial()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {getDisplayName()}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {customer.email}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                              {getAccountType()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate("/customer/profile", {
                            state: navigationState,
                          });
                        }}
                        className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors text-left"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Thông tin tài khoản
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate("/customer/orders", {
                            state: navigationState,
                          });
                        }}
                        className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors text-left"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        Lịch sử đặt món
                      </button>
                    </div>

                    <div className="p-2 border-t">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {cartItemCount > 0 && (
              <div className="hidden md:block px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                {cartItemCount} items in cart
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MenuHeader;
