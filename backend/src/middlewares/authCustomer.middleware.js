import Customer from '../models/customer.js';
import customerService from '../services/customer.service.js';
import logger from '../config/logger.js';

const authCustomer = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    //Trường hợp chưa đăng nhập
    if (!token) {
      req.user = null; 
      return next(); 
    }

    //Trường hợp có đăng nhập
    try {
      const decoded = customerService.verifyToken(token);
      const customerUid = decoded.uid;
      
      if (!customerUid) {
        req.user = null;
        return next();
      }

      const customer = await Customer.findByPk(customerUid);
      
      if (customer) {
        req.user = {
          uid: customer.uid,
          id: customer.uid,
          username: customer.username,
          email: customer.email,
          role: "customer"
        };
      } else {
        req.user = null; 
      }

    } catch (tokenError) {
      logger.warn("Token khách hàng lỗi hoặc hết hạn, xử lý như khách vãng lai");
      req.user = null;
    }

    next();
    
  } catch (error) {
    logger.error("Lỗi hệ thống tại Auth middleware:", error.message);
    return res.status(500).json({ 
      success: false, 
      error: "Lỗi hệ thống xác thực" 
    });
  }
};

export default authCustomer;
