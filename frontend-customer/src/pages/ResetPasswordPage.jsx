import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import customerService from "../services/customerService";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp, resetToken, from = "/" } = location.state || {};

  // Redirect nếu không có email hoặc OTP
  useEffect(() => {
    if (!email || (!otp && !resetToken)) {
      navigate("/customer/forgot-password", { state: { from } });
    }
  }, [email, otp, resetToken, navigate, from]);

  const validatePassword = () => {
    if (password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (password !== confirmPassword) {
      return "Mật khẩu xác nhận không khớp";
    }
    return "";
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await customerService.resetPassword(
        email,
        resetToken || otp,
        password,
        confirmPassword,
      );
      
      if (result.success) {
        setSuccess("Đặt lại mật khẩu thành công! Bạn sẽ được chuyển đến trang đăng nhập...");
        
        // Chuyển về trang login sau 3 giây
        setTimeout(() => {
          navigate("/customer/login", {
            state: {
              from: from,
              message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới",
              registeredEmail: email
            }
          });
        });
      } else {
        setError(result.error || "Không thể đặt lại mật khẩu");
      }
    } catch (err) {
      setError(err.message || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">R</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Restaurant</h1>
          <h2 className="text-xl font-semibold mt-2 text-gray-700">Đặt Lại Mật Khẩu</h2>
          <div className="bg-green-50 p-4 rounded-lg mt-4">
            <div className="flex items-center justify-center text-green-600 mb-2">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <p className="font-semibold">Xác thực OTP thành công!</p>
            </div>
            <p className="text-sm text-gray-600">Vui lòng đặt mật khẩu mới cho tài khoản</p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            {success}
          </div>
        )}
        
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all pr-10"
                placeholder="Ít nhất 6 ký tự"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Xác nhận mật khẩu mới
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              placeholder="Nhập lại mật khẩu"
              required
              disabled={loading}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
            />
            <label htmlFor="showPassword" className="ml-2 text-sm text-gray-600">
              Hiển thị mật khẩu
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate("/customer/forgot-password/verify-otp", { state: { email, from } })}
              disabled={loading}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className={`flex-1 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700"}`}
            >
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Đã nhớ mật khẩu?
            <Link
              to="/customer/login"
              state={{ from: from }}
              className="ml-2 text-amber-600 font-semibold hover:text-amber-700"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
