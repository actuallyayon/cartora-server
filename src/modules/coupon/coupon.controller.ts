import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { getParam } from '@/shared/http';
import { HttpStatus } from '@/shared/httpStatus';
import { ApiError } from '@/shared/ApiError';
import {
  createCoupon,
  deleteCoupon,
  getCoupon,
  listCoupons,
  updateCoupon,
  validateCoupon,
} from '@/modules/coupon/coupon.service';

export const create = catchAsync(async (req: Request, res: Response) => {
  const coupon = await createCoupon(req.body);
  sendResponse(res, { statusCode: HttpStatus.CREATED, message: 'Coupon created', data: coupon });
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin';
  const coupons = await listCoupons(includeInactive);
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Coupons', data: coupons });
});

export const detail = catchAsync(async (req: Request, res: Response) => {
  const coupon = await getCoupon(getParam(req, 'id'));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Coupon', data: coupon });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const coupon = await updateCoupon(getParam(req, 'id'), req.body);
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Coupon updated', data: coupon });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await deleteCoupon(getParam(req, 'id'));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Coupon deleted', data: null });
});

export const validate = catchAsync(async (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await validateCoupon(code, subtotal, String(req.user.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Coupon is valid',
    data: {
      code: result.coupon.code,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
      discount: result.discount,
    },
  });
});
