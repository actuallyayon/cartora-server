import { z } from 'zod';

const password = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(72, 'Password is too long');

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name is too short').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
