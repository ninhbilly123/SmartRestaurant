import express from "express";
import { 
  register, 
  login, 
  syncGoogleUser,
  getMe, 
  updateMe, 
  checkEmailExists,
  verifyEmailOTP,
  resendOTP,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  updateProfile,
  changePassword,
  updateAvatar,
  deleteAvatar
} from "../../controllers/customer/customerAuth.controller.js";
import { requireCustomerAuth } from "../../middlewares/authCustomer.middleware.js";
import { uploadAvatar, handleAvatarUploadErrors } from "../../middlewares/uploadAvatar.middleware.js"; // IMPORT MIDDLEWARE MỚI

const router = express.Router();

// ========== PUBLIC ROUTES (không cần auth) ==========

// Đăng ký/Đăng nhập
router.post("/register", register);
router.post("/login", login);

// Đồng bộ Google user
router.post("/sync-google", syncGoogleUser);

// Kiểm tra email đã tồn tại chưa
router.get("/check-email", checkEmailExists);

// OTP routes cho xác thực email
router.post("/verify-email", verifyEmailOTP);

// Gửi lại mã OTP
router.post("/resend-otp", resendOTP);

// Gửi OTP quên mật khẩu
router.post("/forgot-password/send-otp", sendForgotPasswordOTP);

// Xác thực OTP quên mật khẩu
router.post("/forgot-password/verify-otp", verifyForgotPasswordOTP);

// Đặt lại mật khẩu sau khi xác thực OTP
router.post("/forgot-password/reset", resetPassword);

// ========== PROTECTED ROUTES (cần auth) ==========

// Lấy thông tin cá nhân
router.get("/me", requireCustomerAuth, getMe);

// Cập nhật thông tin cá nhân 
router.put("/me", requireCustomerAuth, updateMe);

// Cập nhật profile (chỉ username và phone)
router.put("/profile", requireCustomerAuth, updateProfile);

// Đổi mật khẩu (cần mật khẩu cũ)
router.put("/password", requireCustomerAuth, changePassword);

// ========== AVATAR UPLOAD ROUTE ==========
// Cập nhật avatar - Upload file lên Cloudinary
router.put("/avatar", 
  requireCustomerAuth,
  uploadAvatar,
  handleAvatarUploadErrors,
  updateAvatar
);

// route DELETE avatar
router.delete("/avatar", requireCustomerAuth, deleteAvatar);

export default router;
