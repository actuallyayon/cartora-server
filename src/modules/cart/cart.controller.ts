import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { getParam } from '@/shared/http';
import { HttpStatus } from '@/shared/httpStatus';
import {
  addToCart,
  buildCartView,
  clearCart,
  removeCartItem,
  updateCartItem,
} from '@/modules/cart/cart.service';

const userId = (req: Request): string => req.user!.id as string;

export const getCart = catchAsync(async (req: Request, res: Response) => {
  const cart = await buildCartView(userId(req));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Cart', data: cart });
});

export const addItem = catchAsync(async (req: Request, res: Response) => {
  const cart = await addToCart(userId(req), req.body);
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Added to cart', data: cart });
});

export const updateItem = catchAsync(async (req: Request, res: Response) => {
  const cart = await updateCartItem(userId(req), getParam(req, 'productId'), req.body.quantity);
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Cart updated', data: cart });
});

export const removeItem = catchAsync(async (req: Request, res: Response) => {
  const cart = await removeCartItem(userId(req), getParam(req, 'productId'));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Item removed', data: cart });
});

export const emptyCart = catchAsync(async (req: Request, res: Response) => {
  const cart = await clearCart(userId(req));
  sendResponse(res, { statusCode: HttpStatus.OK, message: 'Cart cleared', data: cart });
});
