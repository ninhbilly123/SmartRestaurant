import express from 'express';
import { getTableActiveOrder } from '../../controllers/customer/table.controller.js';
import { requireTableAccess } from '../../middlewares/customerAccess.middleware.js';

const router = express.Router();

// GET /api/customer/tables/:tableId/active-order
router.get(
  '/:tableId/active-order',
  (req, res, next) => {
    req.query.table = req.params.tableId;
    next();
  },
  requireTableAccess,
  getTableActiveOrder
);

export default router;
