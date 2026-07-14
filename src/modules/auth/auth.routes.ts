import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate } from '@/middlewares/auth';
import { authLimiter } from '@/middlewares/rateLimiter';
import { loginSchema, registerSchema } from '@/modules/auth/auth.validation';
import { login, logout, me, refresh, register, googleSignIn } from '@/modules/auth/auth.controller';

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), register);
router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/google', authLimiter, googleSignIn);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export const authRoutes = router;
