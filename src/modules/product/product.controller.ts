import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { getParam } from '@/shared/http';
import { HttpStatus } from '@/shared/httpStatus';
import { buildMeta } from '@/shared/pagination';
import { listProductsSchema } from '@/modules/product/product.validation';
import {
  createProduct,
  deleteProduct,
  getProduct,
  getRelatedProducts,
  listProducts,
  updateProduct,
} from '@/modules/product/product.service';

export const create = catchAsync(async (req: Request, res: Response) => {
  const product = await createProduct(req.body);
  sendResponse(res, { statusCode: HttpStatus.CREATED, message: 'Product created', data: product });
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user?.role === 'admin';
  // Parse here so query params are validated and coerced (numbers/enums) into a
  // typed object, independent of Express 5's read-only req.query.
  const { query } = listProductsSchema.parse({ query: req.query });
  const { items, total, page, limit } = await listProducts(query, isAdmin);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Products',
    data: items,
    meta: buildMeta(page, limit, total),
  });
});

export const detail = catchAsync(async (req: Request, res: Response) => {
  const product = await getProduct(getParam(req, 'id'));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Product', data: product });
});

export const related = catchAsync(async (req: Request, res: Response) => {
  const products = await getRelatedProducts(getParam(req, 'id'));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Related products', data: products });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const product = await updateProduct(getParam(req, 'id'), req.body);
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Product updated', data: product });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await deleteProduct(getParam(req, 'id'));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Product deleted', data: null });
});
