import { Router } from 'express';
import {
  getOrder,
  getStats,
  listCustomers,
  listOrders,
  rejectPayment,
  streamReceipt,
  updateOrderStatus,
  verifyPayment,
} from '../controllers/adminController.js';
import { adminListProducts } from '../controllers/productController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.use((_req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  next();
});

router.get('/stats', getStats);
router.get('/orders', listOrders);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/verify', verifyPayment);
router.patch('/orders/:id/reject', rejectPayment);
router.patch('/orders/:id/status', updateOrderStatus);
router.get('/receipts/:filename', streamReceipt);
router.get('/customers', listCustomers);
router.get('/products', adminListProducts);

export default router;
