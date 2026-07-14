import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { HttpStatus } from '@/shared/httpStatus';
import { ApiError } from '@/shared/ApiError';
import { getParam } from '@/shared/http';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from '@/modules/notification/notification.service';

export const list = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await getUserNotifications(String(req.user.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'User notifications',
    data: result,
  });
});

export const read = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await markAsRead(getParam(req, 'id'), String(req.user.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Notification marked as read',
    data: result,
  });
});

export const readAll = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await markAllAsRead(String(req.user.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'All notifications marked as read',
    data: result,
  });
});
