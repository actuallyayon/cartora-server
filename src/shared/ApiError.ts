import type { HttpStatusCode } from '@/shared/httpStatus';

/**
 * Operational error thrown intentionally by the app (validation, auth, not found…).
 * The global error handler distinguishes these from unexpected programmer errors.
 */
export class ApiError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;

  constructor(statusCode: HttpStatusCode, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
