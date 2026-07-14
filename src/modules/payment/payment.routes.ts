import { Router } from 'express';
import { stripeWebhook } from '@/modules/payment/payment.controller';

const router = Router();

// Stripe calls this webhook directly, signature verification secures it.
router.post('/webhook', stripeWebhook);

export const paymentRoutes = router;
