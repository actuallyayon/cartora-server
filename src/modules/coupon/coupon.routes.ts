import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate, authorize } from '@/middlewares/auth';
import {
  couponIdSchema,
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from '@/modules/coupon/coupon.validation';
import { create, detail, list, remove, update, validate } from '@/modules/coupon/coupon.controller';

const router = Router();

// Validate coupon route (available to all logged-in customers during checkout)
router.post('/validate', authenticate, validateRequest(validateCouponSchema), validate);

// Admin-only coupon management
router.post('/', authenticate, authorize('admin'), validateRequest(createCouponSchema), create);
router.get('/', authenticate, authorize('admin'), list);
router.get('/:id', authenticate, authorize('admin'), validateRequest(couponIdSchema), detail);
router.patch('/:id', authenticate, authorize('admin'), validateRequest(updateCouponSchema), update);
router.delete('/:id', authenticate, authorize('admin'), validateRequest(couponIdSchema), remove);

export const couponRoutes = router;
