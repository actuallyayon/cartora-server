import { z } from 'zod';
import { objectId } from '@/shared/validators';

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(100),
  phone: z.string().trim().min(5, 'Valid phone number is required').max(20),
  line1: z.string().trim().min(5, 'Address line 1 is required').max(150),
  line2: z.string().trim().max(150).optional(),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().min(3, 'Postal code is required').max(15),
  country: z.string().trim().min(2, 'Country is required').max(100),
});

export const checkoutSchema = z.object({
  body: z.object({
    shippingAddress: shippingAddressSchema,
    couponCode: z.string().trim().toUpperCase().optional(),
  }),
});

export const orderIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>['body'];
