import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { ApiError } from '@/shared/ApiError';
import { HttpStatus, type HttpStatusCode } from '@/shared/httpStatus';
import { isDevelopment } from '@/config/env';

interface NormalizedError {
  statusCode: HttpStatusCode;
  message: string;
  errors?: { path: string; message: string }[];
}

/**
 * Converts any thrown error into the standard response envelope.
 * Handles Zod validation, Mongoose validation/cast/duplicate-key, our own
 * ApiError, and unexpected errors — never leaking stack traces in production.
 */
const normalize = (err: unknown): NormalizedError => {
  if (err instanceof ZodError) {
    return {
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, message: err.message };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    };
  }

  if (err instanceof mongoose.Error.CastError) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: `Invalid value for "${err.path}"`,
    };
  }

  if (
    err !== null &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  ) {
    return { statusCode: HttpStatus.CONFLICT, message: 'Duplicate value violates a unique field' };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: err instanceof Error ? err.message : 'Something went wrong',
  };
};

// Express identifies error handlers by their 4-arg signature; `_next` is required.
export const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const normalized = normalize(err);

  res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    data: null,
    ...(normalized.errors ? { errors: normalized.errors } : {}),
    ...(isDevelopment && err instanceof Error ? { stack: err.stack } : {}),
  });
};
