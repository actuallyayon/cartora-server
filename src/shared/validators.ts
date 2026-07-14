import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

/** Reusable Zod validator for a MongoDB ObjectId string. */
export const objectId = z
  .string()
  .refine((value) => isValidObjectId(value), { message: 'Invalid id' });

/** Params validator for public read routes that accept an ObjectId OR a slug. */
export const idOrSlugParam = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
});
