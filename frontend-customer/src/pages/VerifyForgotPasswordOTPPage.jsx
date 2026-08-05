import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import customerService from "../services/customerService";

const VerifyForgotPasswordOTPPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 phút
  const [resendLoading, setResendLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { email, from = "/" } = location.state || {};

  // Redirect nếu không có email
  useEffect(() => {
    if (!email) {
      navigate("/customer/forgot-password", { state: { from } });
    }
  }, [email, navigate, from]);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Xử lý nhập OTP
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Chỉ nhập 1 ký tự
    
    // Chỉ cho phép nhập số
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Tự động focus sang ô tiếp theo
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Xử lý key down
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Nếu ô hiện tại trống, xóa ô trước đó
      document.getElementById(`otp-${index - 1}`).focus();
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
    }
  };

  // Gửi lại OTP
  const handleResendOTP = async () => {
    if (countdown > 0) {
      setError(`Vui lòng đợi ${formatTime(countdown)} trước khi gửi lại`);
      return;
    }

    setResendLoading(true);
    setError("");
    
    try {
      const result = await customerService.sendForgotPasswordOTP(email);
      
      if (result.success) {
        setSuccess("Đã gửi lại mã OTP");
        setCountdown(120); // Reset countdown
        setOtp(["", "", "", "", "", ""]); // Reset OTP input
      } else {
        setError(result.error || "Không thể gửi lại OTP");
      }
    } catch (err) {
      setError(err.message || "Không thể gửi lại OTP");
    } finally {
      setResendLoading(false);
    }
  };

  // Xác thực OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await customerService.verifyForgotPasswordOTP(email, otpString);
      
      if (result.success) {
        setSuccess("Xác thực OTP thành công!");
        
        // Chuyển sang trang đặt lại mật khẩu
        setTimeout(() => {
          navigate("/customer/forgot-password/reset", {
            state: {
              email: email,
              otp: otpString,
              resetToken: result.data?.resetToken,
              from: from
            }
          });
        });
      } else {
        setError(result.error || "Mã OTP không hợp lệ");
      }
    } catch (err) {
      setError(err.message || "Xác thực OTP thất bại");
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
          <h2 className="text-xl font-semibold mt-2 text-gray-700">Xác Thực OTP</h2>
          <div className="bg-amber-50 p-4 rounded-lg mt-4">
            <p className="text-gray-700 font-medium">Mã OTP đã được gửi đến:</p>
            <p className="text-lg font-bold text-amber-700">{email}</p>
            {countdown > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Mã OTP hết hạn sau: <span className="font-bold">{formatTime(countdown)}</span>
              </p>
            )}
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
        
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-4 text-center">
              Nhập mã OTP 6 số
            </label>
            <div className="flex justify-center space-x-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-300 transition-all"
                  maxLength="1"
                  disabled={loading}
                />
              ))}
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <p className="text-gray-500 text-sm">
                Không nhận được mã?
              </p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendLoading || countdown > 0}
                className={`text-sm ${countdown > 0 ? "text-gray-400" : "text-amber-600 hover:text-amber-700 font-medium"}`}
              >
                {resendLoading ? "Đang gửi..." : countdown > 0 ? `Gửi lại sau ${formatTime(countdown)}` : "Gửi lại mã"}
              </button>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate("/customer/forgot-password", { state: { from } })}
              disabled={loading}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className={`flex-1 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading || otp.join("").length !== 6 ? "bg-gray-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700"}`}
            >
              {loading ? "Đang xác thực..." : "Xác thực OTP"}
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

export default VerifyForgotPasswordOTPPage;
