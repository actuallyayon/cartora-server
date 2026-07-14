import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate, authorize, optionalAuthenticate } from '@/middlewares/auth';
import {
  createProductSchema,
  productIdSchema,
  productLookupSchema,
  updateProductSchema,
} from '@/modules/product/product.validation';
import {
  create,
  detail,
  list,
  related,
  remove,
  update,
} from '@/modules/product/product.controller';

const router = Router();

// Public reads. `list` validates/coerces its own query params.
router.get('/', optionalAuthenticate, list);
router.get('/:id', validateRequest(productLookupSchema), detail);
router.get('/:id/related', validateRequest(productLookupSchema), related);

// Admin-only writes.
router.post('/', authenticate, authorize('admin'), validateRequest(createProductSchema), create);
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validateRequest(updateProductSchema),
  update,
);
router.delete('/:id', authenticate, authorize('admin'), validateRequest(productIdSchema), remove);

export const productRoutes = router;
