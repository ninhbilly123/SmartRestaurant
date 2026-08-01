import * as authService from "./customer/authService";
import * as orderService from "./customer/orderService";
import * as paymentService from "./customer/paymentService";
import * as profileService from "./customer/profileService";
import * as reviewService from "./customer/reviewService";

const customerService = {
  ...authService,
  ...profileService,
  ...orderService,
  ...paymentService,
  ...reviewService,
};

export default customerService;
