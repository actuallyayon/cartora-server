import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { getParam } from '@/shared/http';
import { HttpStatus } from '@/shared/httpStatus';
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from '@/modules/category/category.service';

export const create = catchAsync(async (req: Request, res: Response) => {
  const category = await createCategory(req.body);
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    message: 'Category created',
    data: category,
  });
});

export const list = catchAsync(async (req: Request, res: Response) => {
  // Admins may request inactive categories via ?includeInactive=true.
  const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'admin';
  const categories = await listCategories(includeInactive);
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Categories', data: categories });
});

export const detail = catchAsync(async (req: Request, res: Response) => {
  const category = await getCategory(getParam(req, 'id'));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Category', data: category });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const category = await updateCategory(getParam(req, 'id'), req.body);
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Category updated', data: category });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await deleteCategory(getParam(req, 'id'));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Category deleted', data: null });
});
