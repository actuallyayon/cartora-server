import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { HttpStatus } from '@/shared/httpStatus';
import { ApiError } from '@/shared/ApiError';
import { uploadToImgBB } from '@/modules/upload/upload.service';

export const uploadImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'No image file provided');
  }

  const image = await uploadToImgBB(req.file.buffer, req.file.originalname);
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    message: 'Image uploaded',
    data: image,
  });
});
