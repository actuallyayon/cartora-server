import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate, authorize } from '@/middlewares/auth';
import { checkoutSchema } from '@/modules/order/order.validation';
import { updateStatusSchema } from '@/modules/order/admin-order.validation';
import { checkout, detail, list, adminList, adminUpdateStatus, userCancel } from '@/modules/order/order.controller';

const router = Router();

// Administrative order routes
router.get('/admin', authenticate, authorize('admin'), adminList);
router.patch('/admin/:id/status', authenticate, authorize('admin'), validateRequest(updateStatusSchema), adminUpdateStatus);

// Customer checkout and orders
router.post('/checkout', authenticate, validateRequest(checkoutSchema), checkout);
router.get('/', authenticate, list);
router.patch('/:id/cancel', authenticate, userCancel);
router.get('/:id', authenticate, detail);

export const orderRoutes = router;

