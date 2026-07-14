import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { HttpStatus } from '@/shared/httpStatus';
import { ApiError } from '@/shared/ApiError';
import { getParam } from '@/shared/http';
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/modules/address/address.service';

export const list = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await getUserAddresses(String(req.user.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'User address list',
    data: result,
  });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await createAddress(String(req.user.id), req.body);
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    message: 'Address saved successfully',
    data: result,
  });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await updateAddress(getParam(req, 'id'), String(req.user.id), req.body);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Address updated successfully',
    data: result,
  });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await deleteAddress(getParam(req, 'id'), String(req.user.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Address deleted successfully',
    data: result,
  });
});

export const markDefault = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await setDefaultAddress(getParam(req, 'id'), String(req.user.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Default address updated successfully',
    data: result,
  });
});
