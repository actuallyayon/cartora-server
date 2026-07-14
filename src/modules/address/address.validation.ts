import { z } from 'zod';
import { objectId } from '@/shared/validators';

export const createAddressSchema = z.object({
  body: z.object({
    label: z.string().max(40).optional(),
    fullName: z.string().min(2).max(80),
    phone: z.string().min(5).max(20),
    line1: z.string().min(3).max(120),
    line2: z.string().max(120).optional(),
    city: z.string().min(2).max(60),
    state: z.string().max(60).optional(),
    postalCode: z.string().min(3).max(20),
    country: z.string().min(2).max(60),
    isDefault: z.boolean().default(false),
  }),
});

export const updateAddressSchema = z.object({
  params: z.object({ id: objectId }),
  body: createAddressSchema.shape.body.partial(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>['body'];
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>['body'];
