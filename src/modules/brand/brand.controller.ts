import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { getParam } from '@/shared/http';
import { HttpStatus } from '@/shared/httpStatus';
import {
  createBrand,
  deleteBrand,
  getBrand,
  listBrands,
  updateBrand,
} from '@/modules/brand/brand.service';

export const create = catchAsync(async (req: Request, res: Response) => {
  const brand = await createBrand(req.body);
  sendResponse(res, { statusCode: HttpStatus.CREATED, message: 'Brand created', data: brand });
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin';
  const brands = await listBrands(includeInactive);
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Brands', data: brands });
});

export const detail = catchAsync(async (req: Request, res: Response) => {
  const brand = await getBrand(getParam(req, 'id'));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Brand', data: brand });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const brand = await updateBrand(getParam(req, 'id'), req.body);
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Brand updated', data: brand });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await deleteBrand(getParam(req, 'id'));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Brand deleted', data: null });
});
