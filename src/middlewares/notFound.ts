import type { Request, Response } from 'express';
import { HttpStatus } from '@/shared/httpStatus';
import { sendResponse } from '@/shared/sendResponse';

/**
 * Terminal handler for unmatched routes. Keeps the `{ success, message, data }`
 * contract instead of Express' default HTML 404 page.
 */
export const notFound = (req: Request, res: Response): void => {
  sendResponse(res, {
    statusCode: HttpStatus.NOT_FOUND,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    data: null,
  });
};
