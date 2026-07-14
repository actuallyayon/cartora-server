import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { HttpStatus } from '@/shared/httpStatus';
import { ApiError } from '@/shared/ApiError';
import { handleStripeWebhook } from '@/modules/payment/payment.service';

export const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Missing stripe-signature header');
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Missing raw request body buffer');
  }

  const result = await handleStripeWebhook(rawBody, signature);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Stripe webhook event processed',
    data: result,
  });
});
