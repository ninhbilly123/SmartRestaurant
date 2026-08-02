import * as authService from "./customer/auth.service.js";
import * as passwordService from "./customer/password.service.js";
import * as profileService from "./customer/profile.service.js";
import * as emailVerificationService from "./customer/emailVerification.service.js";

export default {
  ...authService,
  ...passwordService,
  ...profileService,
  ...emailVerificationService,
};
