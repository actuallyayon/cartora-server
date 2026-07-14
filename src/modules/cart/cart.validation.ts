import { z } from 'zod';
import { objectId } from '@/shared/validators';

export const addToCartSchema = z.object({
  body: z.object({
    productId: objectId,
    quantity: z.number().int().min(1).max(99).default(1),
    selectedVariant: z
      .object({ name: z.string().trim().min(1), value: z.string().trim().min(1) })
      .optional(),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({ productId: objectId }),
  body: z.object({ quantity: z.number().int().min(1).max(99) }),
});

export const cartItemParamSchema = z.object({
  params: z.object({ productId: objectId }),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>['body'];
