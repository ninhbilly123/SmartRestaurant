export { register, login, syncGoogleUser } from "./auth/auth.controller.js";
export {
  checkEmailExists,
  verifyEmailOTP,
  resendOTP,
} from "./auth/emailVerification.controller.js";
export {
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  changePassword,
  sendOtpResetPassword,
} from "./auth/password.controller.js";
export { getMe, updateMe, updateProfile } from "./profile/profile.controller.js";
export { updateAvatar, deleteAvatar } from "./profile/avatar.controller.js";
