import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate, authorize, optionalAuthenticate } from '@/middlewares/auth';
import { idOrSlugParam } from '@/shared/validators';
import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from '@/modules/category/category.validation';
import { create, detail, list, remove, update } from '@/modules/category/category.controller';

const router = Router();

// Public reads (optionalAuthenticate lets admins additionally see inactive items).
router.get('/', optionalAuthenticate, list);
router.get('/:id', validateRequest(idOrSlugParam), detail);

// Admin-only writes.
router.post('/', authenticate, authorize('admin'), validateRequest(createCategorySchema), create);
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validateRequest(updateCategorySchema),
  update,
);
router.delete('/:id', authenticate, authorize('admin'), validateRequest(categoryIdSchema), remove);

export const categoryRoutes = router;
