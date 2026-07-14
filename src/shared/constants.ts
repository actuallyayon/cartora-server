/**
 * Domain enums shared by models and (later) Zod validators.
 * Declared `as const` so they can drive both runtime validation and TS types.
 */
export const USER_ROLES = ['customer', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'banned'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const AUTH_PROVIDERS = ['local', 'google'] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = ['stripe'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const DISCOUNT_TYPES = ['percentage', 'fixed'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const ADDRESS_TYPES = ['shipping', 'billing'] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];

export const NOTIFICATION_TYPES = ['order', 'promo', 'system', 'review', 'account'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const BANNER_POSITIONS = ['hero', 'promo', 'sidebar'] as const;
export type BannerPosition = (typeof BANNER_POSITIONS)[number];
