import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabaseAuthService from '../services/supabaseAuthService';
import customerService from '../services/customerService';
import { setCustomerSession } from '../utils/customerAuth';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Lấy tham số từ URL
        const searchParams = new URLSearchParams(location.search);
        const tableId = searchParams.get('table');
        const token = searchParams.get('token');
        const from = searchParams.get('from') || '/menu';
        
        
        // Kiểm tra session từ Supabase
        const { session, error: sessionError } = await supabaseAuthService.getSession();
        
        if (sessionError || !session?.user) {
          throw new Error('Không thể lấy thông tin từ Google');
        }

        const user = session.user;

        // Chuẩn bị data để đồng bộ 
        const syncData = {
          email: user.email,
          username : user.user_metadata?.full_name || user.email.split('@')[0],
        };
        
        const syncResult = await customerService.syncGoogleUser(syncData);
        
        if (!syncResult.success) {
          console.error("[CALLBACK] Đồng bộ thất bại:", syncResult.error);
          throw new Error(syncResult.error || 'Không thể đồng bộ với hệ thống');
        }

        const customer = syncResult.customer || syncResult.data?.customer || syncResult.data;
        const accessToken = syncResult.accessToken || syncResult.data?.accessToken || syncResult.data?.token;

        if (accessToken) {
          setCustomerSession(accessToken, customer, 'google');
        }

        // Tạo redirect path
        let redirectPath = from;
        
        // Thêm query parameters nếu có
        const params = new URLSearchParams();
        if (tableId) params.append('table', tableId);
        if (token) params.append('token', token);
        
        if (params.toString()) {
          redirectPath = redirectPath.includes('?') 
            ? `${redirectPath}&${params.toString()}`
            : `${redirectPath}?${params.toString()}`;
        }

        // Redirect về trang đích với thông tin user
        navigate(redirectPath, {
          replace: true,
          state: {
            message: 'Đăng nhập Google thành công!',
            user: customer,
            socialLogin: true
          }
        });

      } catch (err) {
        console.error('[CALLBACK] Lỗi:', err);
        
        // Redirect về login với thông báo lỗi
        const loginPath = '/customer/login';
        navigate(loginPath, {
          replace: true,
          state: {
            error: err.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
          }
        });
      }
    };

    handleCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đang đăng nhập...</h1>
        <p className="text-gray-600">Đang đồng bộ thông tin với hệ thống</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
