/**
 * Central model registry. Importing this module registers every Mongoose model
 * exactly once, which is required so `ref`/`populate` can resolve related models
 * regardless of import order. `server.ts` imports it at bootstrap.
 */
export { User } from '@/modules/user/user.model';
export { Category } from '@/modules/category/category.model';
export { Brand } from '@/modules/brand/brand.model';
export { Product } from '@/modules/product/product.model';
export { Cart } from '@/modules/cart/cart.model';
export { Wishlist } from '@/modules/wishlist/wishlist.model';
export { Coupon } from '@/modules/coupon/coupon.model';
export { Order } from '@/modules/order/order.model';
export { OrderItem } from '@/modules/order/orderItem.model';
export { Payment } from '@/modules/payment/payment.model';
export { Review } from '@/modules/review/review.model';
export { Address } from '@/modules/address/address.model';
export { Notification } from '@/modules/notification/notification.model';
export { Banner } from '@/modules/banner/banner.model';
