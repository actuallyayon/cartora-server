import type { Response } from 'express';
import type { HttpStatusCode } from '@/shared/httpStatus';

/**
 * Consistent API response envelope used by every endpoint: `{ success, message, data }`.
 * Optional `meta` carries pagination and similar list metadata.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

interface SendResponseArgs<T> {
  statusCode: HttpStatusCode;
  message: string;
  data: T;
  meta?: ApiResponse<T>['meta'];
}

export const sendResponse = <T>(res: Response, args: SendResponseArgs<T>): void => {
  const payload: ApiResponse<T> = {
    success: args.statusCode >= 200 && args.statusCode < 400,
    message: args.message,
    data: args.data,
  };

  if (args.meta) {
    payload.meta = args.meta;
  }

  res.status(args.statusCode).json(payload);
};
