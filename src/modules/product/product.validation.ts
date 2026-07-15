import { z } from 'zod';
import { objectId } from '@/shared/validators';

const variantSchema = z.object({
  name: z.string().trim().min(1),
  value: z.string().trim().min(1),
  priceDelta: z.number().default(0),
  stock: z.number().int().min(0).default(0),
  sku: z.string().trim().optional(),
});

const specSchema = z.object({
  key: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().min(10),
    richDescription: z.string().trim().optional(),
    brand: objectId.optional(),
    category: objectId,
    price: z.number().min(0),
    compareAtPrice: z.number().min(0).optional(),
    currency: z.string().trim().length(3).optional(),
    thumbnail: z.string().url(),
    images: z.array(z.string().url()).default([]),
    sku: z.string().trim().min(1),
    stock: z.number().int().min(0).default(0),
    variants: z.array(variantSchema).default([]),
    specs: z.array(specSchema).default([]),
    tags: z.array(z.string().trim()).default([]),
    isFeatured: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: objectId }),
  body: createProductSchema.shape.body.partial(),
});

// Admin write routes address products strictly by ObjectId.
export const productIdSchema = z.object({
  params: z.object({ id: objectId }),
});

// Public read routes accept either an ObjectId or a slug.
export const productLookupSchema = z.object({
  params: z.object({ id: z.string().trim().min(1) }),
});

// Query params arrive as strings; coerce the numeric/boolean ones.
export const listProductsSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(), // id or slug
    brand: z.string().trim().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    featured: z.enum(['true', 'false']).optional(),
    newArrival: z.enum(['true', 'false']).optional(),
    bestSeller: z.enum(['true', 'false']).optional(),
    sort: z.enum(['newest', 'price-asc', 'price-desc', 'rating', 'popular']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(60).optional(),
    includeInactive: z.enum(['true', 'false']).optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ListProductsQuery = z.infer<typeof listProductsSchema>['query'];
