import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { HttpStatus } from '@/shared/httpStatus';
import { ApiError } from '@/shared/ApiError';
import { getParam } from '@/shared/http';
import {
  processCheckout,
  getOrderDetails,
  listUserOrders,
  listAllOrders,
  updateOrderStatus,
  cancelOrder,
} from '@/modules/order/order.service';

export const checkout = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const result = await processCheckout(String(req.user.id), req.body);
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    message: 'Checkout session created successfully',
    data: result,
  });
});

export const detail = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const order = await getOrderDetails(getParam(req, 'id'), String(req.user.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Order details',
    data: order,
  });
});

export const list = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const orders = await listUserOrders(String(req.user.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'User orders',
    data: orders,
  });
});

export const adminList = catchAsync(async (req: Request, res: Response) => {
  const status = req.query.status as string || undefined;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  
  const result = await listAllOrders({ status, page, limit });
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'All platform orders',
    data: result,
  });
});

export const adminUpdateStatus = catchAsync(async (req: Request, res: Response) => {
  const { orderStatus } = req.body;
  const order = await updateOrderStatus(getParam(req, 'id'), orderStatus);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Order status updated successfully',
    data: order,
  });
});

export const userCancel = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const order = await cancelOrder(getParam(req, 'id'), String(req.user.id));
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Order cancelled successfully',
    data: order,
  });
});
