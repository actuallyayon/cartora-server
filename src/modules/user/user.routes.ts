import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate } from '@/middlewares/auth';
import { updateProfileSchema } from '@/modules/user/user.validation';
import { profile, editProfile } from '@/modules/user/user.controller';

const router = Router();

router.get('/profile', authenticate, profile);
router.patch('/profile', authenticate, validateRequest(updateProfileSchema), editProfile);

export const userRoutes = router;
