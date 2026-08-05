import Customer from "../models/customer.js";
import VerifiedEmail from "../models/verifiedEmail.js";
import logger from "../config/logger.js";
import customerService from "../services/customer.service.js";

const getBearerToken = (authorizationHeader) => {
  const [scheme, token] = authorizationHeader?.split(" ") || [];
  return scheme?.toLowerCase() === "bearer" ? token : null;
};

const clearCustomerAuth = (req) => {
  req.user = null;
  req.customer = null;
};

export const optionalCustomerAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      clearCustomerAuth(req);
      return next();
    }

    try {
      const decoded = customerService.verifyToken(token);

      if (!decoded.uid) {
        clearCustomerAuth(req);
        return next();
      }

      const customer = await Customer.findByPk(decoded.uid);

      if (!customer) {
        clearCustomerAuth(req);
        return next();
      }

      const isEmailVerified =
        customer.auth_method === "google" ||
        !!(await VerifiedEmail.findOne({
          where: {
            customer_uid: customer.uid,
            email: customer.email,
            auth_method: customer.auth_method,
            is_verified: true,
          },
        }));

      if (!isEmailVerified) {
        clearCustomerAuth(req);
        return next();
      }

      const currentCustomer = {
        uid: customer.uid,
        id: customer.uid,
        username: customer.username,
        full_name: customer.full_name || customer.username,
        email: customer.email,
        isEmailVerified,
        role: "customer",
      };

      req.user = currentCustomer;
      req.customer = currentCustomer;
      return next();
    } catch (tokenError) {
      logger.warn("Customer token invalid or expired; continuing as guest");
      clearCustomerAuth(req);
      return next();
    }
  } catch (error) {
    logger.error("Customer auth middleware error:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi hệ thống xác thực",
    });
  }
};

export const requireCustomerAuth = async (req, res, next) => {
  return optionalCustomerAuth(req, res, () => {
    if (!req.customer) {
      return res.status(401).json({
        success: false,
        error: "Vui lòng đăng nhập để tiếp tục",
      });
    }

    return next();
  });
};

export default optionalCustomerAuth;
