import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80).optional(),
    phone: z.string().max(20).optional(),
    avatarUrl: z.string().url().optional().or(z.literal('')),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
