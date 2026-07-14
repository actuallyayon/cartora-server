import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { HttpStatus } from '@/shared/httpStatus';
import { ApiError } from '@/shared/ApiError';
import { getAdminDashboardStats } from '@/modules/analytics/analytics.service';

export const getStats = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  if (req.user.role !== 'admin') {
    throw new ApiError(HttpStatus.FORBIDDEN, 'Access denied. Administrators only.');
  }

  const result = await getAdminDashboardStats();
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Admin dashboard analytics metrics',
    data: result,
  });
});
