import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { HttpStatus } from '@/shared/httpStatus';
import { ApiError } from '@/shared/ApiError';
import { getUserById, updateProfile } from '@/modules/user/user.service';

export const profile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await getUserById(String(req.user.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'User profile details',
    data: result,
  });
});

export const editProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await updateProfile(String(req.user.id), req.body);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});
