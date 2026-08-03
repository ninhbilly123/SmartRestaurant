// routes/orderItem.routes.js
import express from 'express';
import {
  getOrderItemsByOrderId,
  createOrderItems
} from '../../controllers/customer/orderItem.controller.js';
import {
  validateCreateOrderItem,
} from '../../middlewares/orderItem.middleware.js';
import { optionalCustomerAuth } from '../../middlewares/authCustomer.middleware.js';
import { requireOrderAccess } from '../../middlewares/customerAccess.middleware.js';

const router = express.Router();

// GET /api/order-items/order/:orderId
router.get(
  '/order/:orderId',
  optionalCustomerAuth,
  requireOrderAccess((req) => req.params.orderId),
  getOrderItemsByOrderId
);

// POST /api/order-items
router.post(
  '/',
  optionalCustomerAuth,
  requireOrderAccess((req) => req.body.order_id),
  validateCreateOrderItem,
  createOrderItems
);

export default router;
