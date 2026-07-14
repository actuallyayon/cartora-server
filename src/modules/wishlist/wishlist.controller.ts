import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { getParam } from '@/shared/http';
import { HttpStatus } from '@/shared/httpStatus';
import {
  addToWishlist,
  getWishlistIds,
  getWishlistProducts,
  removeFromWishlist,
} from '@/modules/wishlist/wishlist.service';

const userId = (req: Request): string => req.user!.id as string;

export const getWishlist = catchAsync(async (req: Request, res: Response) => {
  const products = await getWishlistProducts(userId(req));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Wishlist', data: products });
});

export const getIds = catchAsync(async (req: Request, res: Response) => {
  const ids = await getWishlistIds(userId(req));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Wishlist ids', data: ids });
});

export const addItem = catchAsync(async (req: Request, res: Response) => {
  const ids = await addToWishlist(userId(req), getParam(req, 'productId'));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Added to wishlist', data: ids });
});

export const removeItem = catchAsync(async (req: Request, res: Response) => {
  const ids = await removeFromWishlist(userId(req), getParam(req, 'productId'));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Removed from wishlist', data: ids });
});
