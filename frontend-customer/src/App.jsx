import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MenuPage from "./pages/MenuPage";
import CustomerLoginPage from "./pages/CustomerLoginPage";
import RegisterPage from "./pages/RegisterPage";
import CustomerProfile from "./pages/CustomerProfile";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import PaymentResultPage from "./pages/PaymentResultPage";
// Import các trang quên mật khẩu
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyForgotPasswordOTPPage from "./pages/VerifyForgotPasswordOTPPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import NotFoundPage from "./pages/NotFoundPage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        {/* Customer-facing menu route - NHẬN QUERY PARAMETERS */}
        <Route path="/menu" element={<MenuPage />} />

        {/* Payment result page - redirect từ MoMo */}
        <Route path="/payment-result" element={<PaymentResultPage />} />

        {/* Customer auth routes */}
        <Route path="/customer/login" element={<CustomerLoginPage />} />
        <Route path="/customer/register" element={<RegisterPage />} />
        <Route path="/customer/verify-email" element={<VerifyEmailPage />} />

        {/* Forgot password routes */}
        <Route
          path="/customer/forgot-password"
          element={<ForgotPasswordPage />}
        />
        <Route
          path="/customer/forgot-password/verify-otp"
          element={<VerifyForgotPasswordOTPPage />}
        />
        <Route
          path="/customer/forgot-password/reset"
          element={<ResetPasswordPage />}
        />

        {/* Customer profile and order routes */}
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/customer/orders" element={<OrderHistoryPage />} />
        <Route path="/customer/orders/:orderId" element={<OrderDetailPage />} />

        {/* Nếu khách vào trang chủ, tự động chuyển vào menu */}
        <Route path="/" element={<Navigate to="/menu" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
