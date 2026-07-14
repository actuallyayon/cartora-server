import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate } from '@/middlewares/auth';
import {
  addToCartSchema,
  cartItemParamSchema,
  updateCartItemSchema,
} from '@/modules/cart/cart.validation';
import {
  addItem,
  emptyCart,
  getCart,
  removeItem,
  updateItem,
} from '@/modules/cart/cart.controller';

const router = Router();

// The whole cart is private to the signed-in user.
router.use(authenticate);

router.get('/', getCart);
router.post('/items', validateRequest(addToCartSchema), addItem);
router.patch('/items/:productId', validateRequest(updateCartItemSchema), updateItem);
router.delete('/items/:productId', validateRequest(cartItemParamSchema), removeItem);
router.delete('/', emptyCart);

export const cartRoutes = router;
