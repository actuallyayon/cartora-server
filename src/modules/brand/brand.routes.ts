import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate, authorize, optionalAuthenticate } from '@/middlewares/auth';
import { idOrSlugParam } from '@/shared/validators';
import {
  brandIdSchema,
  createBrandSchema,
  updateBrandSchema,
} from '@/modules/brand/brand.validation';
import { create, detail, list, remove, update } from '@/modules/brand/brand.controller';

const router = Router();

router.get('/', optionalAuthenticate, list);
router.get('/:id', validateRequest(idOrSlugParam), detail);

router.post('/', authenticate, authorize('admin'), validateRequest(createBrandSchema), create);
router.patch('/:id', authenticate, authorize('admin'), validateRequest(updateBrandSchema), update);
router.delete('/:id', authenticate, authorize('admin'), validateRequest(brandIdSchema), remove);

export const brandRoutes = router;
