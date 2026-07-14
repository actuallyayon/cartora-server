import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import { list, read, readAll } from '@/modules/notification/notification.controller';

const router = Router();

router.get('/', authenticate, list);
router.patch('/read-all', authenticate, readAll);
router.patch('/:id/read', authenticate, read);

export const notificationRoutes = router;
