import express from "express";
import {
  changePassword,
  checkEmailExists,
  deleteAvatar,
  getMe,
  login,
  register,
  resendOTP,
  resetPassword,
  sendForgotPasswordOTP,
  syncGoogleUser,
  updateAvatar,
  updateMe,
  updateProfile,
  verifyEmailOTP,
  verifyForgotPasswordOTP,
} from "../../controllers/customer/customerAuth.controller.js";
import { requireCustomerAuth } from "../../middlewares/authCustomer.middleware.js";
import { createRateLimiter } from "../../middlewares/rateLimit.middleware.js";
import {
  handleAvatarUploadErrors,
  uploadAvatar,
} from "../../middlewares/uploadAvatar.middleware.js";

const router = express.Router();

const normalizeEmailKey = (req) =>
  String(req.body?.email || req.query?.email || req.ip || "")
    .trim()
    .toLowerCase();

const authLimiter = createRateLimiter({
  keyGenerator: normalizeEmailKey,
  keyPrefix: "customer-auth",
  max: 30,
  windowMs: 15 * 60 * 1000,
});

const otpLimiter = createRateLimiter({
  keyGenerator: normalizeEmailKey,
  keyPrefix: "customer-otp",
  max: 5,
  message: "Qua nhieu yeu cau OTP. Vui long thu lai sau.",
  windowMs: 10 * 60 * 1000,
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/sync-google", authLimiter, syncGoogleUser);
router.get("/check-email", authLimiter, checkEmailExists);

router.post("/verify-email", otpLimiter, verifyEmailOTP);
router.post("/resend-otp", otpLimiter, resendOTP);
router.post("/forgot-password/send-otp", otpLimiter, sendForgotPasswordOTP);
router.post("/forgot-password/verify-otp", otpLimiter, verifyForgotPasswordOTP);
router.post("/forgot-password/reset", otpLimiter, resetPassword);

router.get("/me", requireCustomerAuth, getMe);
router.put("/me", requireCustomerAuth, updateMe);
router.put("/profile", requireCustomerAuth, updateProfile);
router.put("/password", requireCustomerAuth, changePassword);
router.put(
  "/avatar",
  requireCustomerAuth,
  uploadAvatar,
  handleAvatarUploadErrors,
  updateAvatar,
);
router.delete("/avatar", requireCustomerAuth, deleteAvatar);

export default router;
