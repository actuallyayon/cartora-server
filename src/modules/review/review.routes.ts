import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate } from '@/middlewares/auth';
import { createReviewSchema } from '@/modules/review/review.validation';
import { create, list, remove } from '@/modules/review/review.controller';

const router = Router();

router.post('/', authenticate, validateRequest(createReviewSchema), create);
router.get('/product/:productId', list);
router.delete('/:id', authenticate, remove);

export const reviewRoutes = router;
