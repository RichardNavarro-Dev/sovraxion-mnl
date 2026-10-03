import { Router } from 'express';
import { createOrder, myOrders } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';
import { orderLimiter } from '../middleware/security.js';
import { handleUpload } from '../middleware/upload.js';

const router = Router();

router.post('/', requireAuth, orderLimiter, handleUpload('receipt'), createOrder);
router.get('/mine', requireAuth, myOrders);

export default router;
