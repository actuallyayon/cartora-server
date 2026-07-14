import { z } from 'zod';
import { objectId } from '@/shared/validators';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60),
    description: z.string().trim().max(500).optional(),
    image: z.string().url().optional(),
    parent: objectId.optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().trim().min(2).max(60),
      description: z.string().trim().max(500),
      image: z.string().url(),
      parent: objectId.nullable(),
      isActive: z.boolean(),
    })
    .partial(),
});

export const categoryIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
