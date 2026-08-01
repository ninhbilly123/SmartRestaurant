import React, { useState } from 'react';
import supabaseAuthService from '../../services/supabaseAuthService';

const SocialLoginButtons = ({ 
  onError,
  disabled = false,
  from,
  location
}) => {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (disabled || googleLoading) return;
    
    setGoogleLoading(true);
    if (onError) onError(null);

    try {
      // Lấy base URL hiện tại
      const baseUrl = window.location.origin;
      
      // Tạo redirect URL với ALL query parameters
      let redirectTo = `${baseUrl}/auth/callback`;
      
      // Thêm TẤT CẢ query parameters từ current URL và from
      const params = new URLSearchParams();
      
      // Thêm from parameter
      if (from) {
        // Nếu from đã có query parameters, parse và thêm từng cái
        const fromUrl = new URL(from, window.location.origin);
        const fromParams = new URLSearchParams(fromUrl.search);
        
        // Thêm tất cả params từ from
        for (const [key, value] of fromParams) {
          params.append(key, value);
        }
        
        // Thêm path như một parameter riêng
        params.append('from_path', fromUrl.pathname);
      }
      
      // Thêm params từ current location
      const searchParams = new URLSearchParams(location.search);
      const tableId = searchParams.get('table');
      const token = searchParams.get('token');
      
      if (tableId) params.append('table', tableId);
      if (token) params.append('token', token);
      
      // Thêm redirect URL vào params (Supabase có thể cần)
      params.append('redirect_to', from || '/menu');
      
      if (params.toString()) {
        redirectTo += `?${params.toString()}`;
      }

      // Gọi Supabase với redirect URL đầy đủ
      const result = await supabaseAuthService.signInWithGoogle(redirectTo);
      
      if (!result.success) {
        throw new Error(result.error || "Đăng nhập Google thất bại");
      }
      // Supabase sẽ chuyển hướng ngay lập tức, không cần xử lý thêm
    } catch (err) {
      console.error("Google login error:", err);
      if (onError) onError(err.message);
      setGoogleLoading(false);
    }
    // Không setLoading false ở đây vì đã chuyển trang
  };

  return (
    <div className="space-y-4">
      {/* Google Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={disabled || googleLoading}
        className={`w-full flex items-center justify-center gap-3 p-3 rounded-lg border transition duration-200 ${
          disabled || googleLoading 
            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
            : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:shadow-sm'
        }`}
      >
        {googleLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin"></div>
            <span>Đang kết nối...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium">Tiếp tục với Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">hoặc</span>
        </div>
      </div>
    </div>
  );
};

export default SocialLoginButtons;
