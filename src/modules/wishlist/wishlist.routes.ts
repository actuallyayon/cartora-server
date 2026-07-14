import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate } from '@/middlewares/auth';
import { cartItemParamSchema } from '@/modules/cart/cart.validation';
import { addItem, getIds, getWishlist, removeItem } from '@/modules/wishlist/wishlist.controller';

const router = Router();

router.use(authenticate);

router.get('/', getWishlist);
router.get('/ids', getIds);
router.post('/:productId', validateRequest(cartItemParamSchema), addItem);
router.delete('/:productId', validateRequest(cartItemParamSchema), removeItem);

export const wishlistRoutes = router;
