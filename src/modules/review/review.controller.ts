import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { HttpStatus } from '@/shared/httpStatus';
import { ApiError } from '@/shared/ApiError';
import { getParam } from '@/shared/http';
import {
  createReview,
  getProductReviews,
  deleteReview,
} from '@/modules/review/review.service';

export const create = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await createReview(String(req.user.id), req.body);
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    message: 'Review submitted successfully',
    data: result,
  });
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const productId = getParam(req, 'productId');
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await getProductReviews(productId, page, limit);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Product reviews list',
    data: result,
  });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await deleteReview(getParam(req, 'id'), String(req.user.id), req.user.role);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Review deleted successfully',
    data: result,
  });
});
