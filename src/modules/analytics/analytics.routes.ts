import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import { getStats } from '@/modules/analytics/analytics.controller';

const router = Router();

router.get('/', authenticate, getStats);

export const analyticsRoutes = router;
