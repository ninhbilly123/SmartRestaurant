// src/routes/customer/review.routes.js
import express from 'express';
import {
  createReview,
  getMenuItemReviews,
  getReviewableItems,
  updateReview,
  deleteReview
} from '../../controllers/customer/review.controller.js';
import {
  optionalCustomerAuth,
  requireCustomerAuth,
} from '../../middlewares/authCustomer.middleware.js';
import { requireOrderAccess } from '../../middlewares/customerAccess.middleware.js';

const router = express.Router();

// GET /api/customer/reviews/menu-item/:menuItemId - Get reviews for a menu item
router.get('/menu-item/:menuItemId', getMenuItemReviews);

// POST /api/customer/reviews - Create a new review
router.post(
  '/',
  optionalCustomerAuth,
  requireOrderAccess((req) => req.body.order_id),
  createReview
);

// GET /api/customer/reviews/order/:orderId/can-review - Check reviewable items
router.get(
  '/order/:orderId/can-review',
  optionalCustomerAuth,
  requireOrderAccess((req) => req.params.orderId),
  getReviewableItems
);

// PUT /api/customer/reviews/:id - Update own review
router.put('/:id', requireCustomerAuth, updateReview);

// DELETE /api/customer/reviews/:id - Delete own review
router.delete('/:id', requireCustomerAuth, deleteReview);

export default router;
