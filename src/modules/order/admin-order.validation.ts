import { z } from 'zod';
import { objectId } from '@/shared/validators';
import { ORDER_STATUSES } from '@/shared/constants';

export const updateStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    orderStatus: z.enum(ORDER_STATUSES),
  }),
});

export const listAllOrdersSchema = z.object({
  query: z.object({
    status: z.enum(ORDER_STATUSES).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
  }),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>['body'];
