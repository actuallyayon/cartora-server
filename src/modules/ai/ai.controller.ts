import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { getParam } from '@/shared/http';
import { HttpStatus } from '@/shared/httpStatus';
import {
  chatWithConcierge,
  getProductInsights,
  generateProductListing,
} from '@/modules/ai/ai.service';
import type { AiChatInput, GenerateProductInput } from '@/modules/ai/ai.validation';

export const chat = catchAsync(async (req: Request, res: Response) => {
  const result = await chatWithConcierge(req.body as AiChatInput);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'AI chat response generated',
    data: result,
  });
});

export const insights = catchAsync(async (req: Request, res: Response) => {
  const productId = getParam(req, 'productId');
  const result = await getProductInsights(productId);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Product insights generated',
    data: result,
  });
});

export const generateProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await generateProductListing(req.body as GenerateProductInput);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Product draft generated with AI',
    data: result,
  });
});
