import { z } from 'zod';
import { objectId } from '@/shared/validators';

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(3).max(20).toUpperCase(),
    description: z.string().trim().max(200).optional(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().nonnegative(),
    minPurchase: z.number().nonnegative().default(0),
    maxDiscount: z.number().nonnegative().optional(),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().default(1),
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCouponSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      code: z.string().trim().min(3).max(20).toUpperCase(),
      description: z.string().trim().max(200),
      discountType: z.enum(['percentage', 'fixed']),
      discountValue: z.number().nonnegative(),
      minPurchase: z.number().nonnegative(),
      maxDiscount: z.number().nonnegative().nullable(),
      usageLimit: z.number().int().positive().nullable(),
      perUserLimit: z.number().int().positive(),
      startsAt: z.coerce.date().nullable(),
      expiresAt: z.coerce.date().nullable(),
      isActive: z.boolean(),
    })
    .partial(),
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1).toUpperCase(),
    subtotal: z.number().positive(),
  }),
});

export const couponIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>['body'];
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>['body'];
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>['body'];
