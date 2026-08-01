import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";

const MenuPage = lazy(() => import("./pages/MenuPage"));
const CustomerLoginPage = lazy(() => import("./pages/CustomerLoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const CustomerProfile = lazy(() => import("./pages/CustomerProfile"));
const OrderHistoryPage = lazy(() => import("./pages/OrderHistoryPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const VerifyForgotPasswordOTPPage = lazy(() => import("./pages/VerifyForgotPasswordOTPPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ProtectedCustomerRoute = lazy(() => import("./components/common/ProtectedCustomerRoute"));

const routeFallback = (
  <div className="min-h-screen flex items-center justify-center text-gray-600">
    Đang tải...
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={routeFallback}>
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
        <Route element={<ProtectedCustomerRoute />}>
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/orders" element={<OrderHistoryPage />} />
          <Route path="/customer/orders/:orderId" element={<OrderDetailPage />} />
        </Route>

        {/* Nếu khách vào trang chủ, tự động chuyển vào menu */}
        <Route path="/" element={<Navigate to="/menu" replace />} />

        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
