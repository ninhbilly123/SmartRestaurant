import Customer from "../models/customer.js";
import logger from "../config/logger.js";
import customerService from "../services/customer.service.js";

export const optionalCustomerAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      req.user = null;
      req.customer = null;
      return next();
    }

    try {
      const decoded = customerService.verifyToken(token);
      const customerUid = decoded.uid;

      if (!customerUid) {
        req.user = null;
        req.customer = null;
        return next();
      }

      const customer = await Customer.findByPk(customerUid);

      if (!customer) {
        req.user = null;
        req.customer = null;
        return next();
      }

      const currentCustomer = {
        uid: customer.uid,
        id: customer.uid,
        username: customer.username,
        full_name: customer.full_name,
        email: customer.email,
        role: "customer",
      };

      req.user = currentCustomer;
      req.customer = currentCustomer;
      return next();
    } catch (tokenError) {
      logger.warn("Customer token invalid or expired; continuing as guest");
      req.user = null;
      req.customer = null;
      return next();
    }
  } catch (error) {
    logger.error("Customer auth middleware error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Lỗi hệ thống xác thực",
    });
  }
};

export const requireCustomerAuth = async (req, res, next) => {
  return optionalCustomerAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Vui lòng đăng nhập để tiếp tục",
      });
    }

    return next();
  });
};

export default optionalCustomerAuth;
