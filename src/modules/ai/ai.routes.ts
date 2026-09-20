import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate, authorize } from '@/middlewares/auth';
import {
  aiChatSchema,
  productInsightsParamSchema,
  generateProductSchema,
} from '@/modules/ai/ai.validation';
import { chat, insights, generateProduct } from '@/modules/ai/ai.controller';

const router = Router();

// Public storefront AI assistant & shopping concierge
router.post('/chat', validateRequest(aiChatSchema), chat);

// Public product details page AI insights
router.get('/insights/:productId', validateRequest(productInsightsParamSchema), insights);

// Admin-only AI product generator & copywriter copilot
router.post(
  '/generate-product',
  authenticate,
  authorize('admin'),
  validateRequest(generateProductSchema),
  generateProduct,
);

export const aiRoutes = router;
