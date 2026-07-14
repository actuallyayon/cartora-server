import { z } from 'zod';
import { objectId } from '@/shared/validators';

export const createReviewSchema = z.object({
  body: z.object({
    product: objectId,
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(3).max(1000),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
