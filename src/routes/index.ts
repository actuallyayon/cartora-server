import { Router } from 'express';
import { HttpStatus } from '@/shared/httpStatus';
import { sendResponse } from '@/shared/sendResponse';
import { catchAsync } from '@/shared/catchAsync';
import { env } from '@/config/env';
import { getDBState } from '@/config/db';
import { authRoutes } from '@/modules/auth/auth.routes';
import { categoryRoutes } from '@/modules/category/category.routes';
import { brandRoutes } from '@/modules/brand/brand.routes';
import { productRoutes } from '@/modules/product/product.routes';
import { uploadRoutes } from '@/modules/upload/upload.routes';
import { cartRoutes } from '@/modules/cart/cart.routes';
import { wishlistRoutes } from '@/modules/wishlist/wishlist.routes';
import { couponRoutes } from '@/modules/coupon/coupon.routes';
import { orderRoutes } from '@/modules/order/order.routes';
import { paymentRoutes } from '@/modules/payment/payment.routes';
import { reviewRoutes } from '@/modules/review/review.routes';
import { addressRoutes } from '@/modules/address/address.routes';
import { notificationRoutes } from '@/modules/notification/notification.routes';
import { userRoutes } from '@/modules/user/user.routes';
import { analyticsRoutes } from '@/modules/analytics/analytics.routes';

/**
 * Root API v1 router. Feature module routers (auth, products, orders, …) are
 * mounted here as they are built in later steps.
 */
const router = Router();

router.get(
  '/health',
  catchAsync(async (_req, res) => {
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      message: 'Cartora API is healthy',
      data: {
        status: 'ok',
        environment: env.NODE_ENV,
        database: getDBState(),
        uptime: Math.floor(process.uptime()),
      },
    });
  }),
);

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/products', productRoutes);
router.use('/uploads', uploadRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/coupons', couponRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/addresses', addressRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analyticsRoutes);

export const apiV1Router = router;
