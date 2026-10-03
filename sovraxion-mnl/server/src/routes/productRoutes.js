import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
  uploadProductImage,
} from '../controllers/productController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { handleUpload } from '../middleware/upload.js';

const router = Router();

router.get('/', listProducts);
router.post('/', requireAuth, requireAdmin, createProduct);
router.post('/upload-image', requireAuth, requireAdmin, handleUpload('image'), uploadProductImage);
router.get('/:idOrSlug', getProduct);
router.put('/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

export default router;
