import { z } from 'zod';
import { objectId } from '@/shared/validators';

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60),
    logo: z.string().url().optional(),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateBrandSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().trim().min(2).max(60),
      logo: z.string().url(),
      description: z.string().trim().max(500),
      isActive: z.boolean(),
    })
    .partial(),
});

export const brandIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>['body'];
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>['body'];
