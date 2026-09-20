import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'model', 'assistant']),
  content: z.string().min(1).max(2000),
});

export const aiChatSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required').max(1000),
    history: z.array(chatMessageSchema).max(20).optional().default([]),
    currentPath: z.string().max(200).optional(),
  }),
});

export const productInsightsParamSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID or slug is required'),
  }),
});

export const generateProductSchema = z.object({
  body: z.object({
    prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(2000),
    existingData: z
      .object({
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        price: z.number().optional(),
        tags: z.array(z.string()).optional(),
        specs: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
      })
      .optional(),
  }),
});

export type AiChatInput = z.infer<typeof aiChatSchema>['body'];
export type GenerateProductInput = z.infer<typeof generateProductSchema>['body'];
