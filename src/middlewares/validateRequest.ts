import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { catchAsync } from '@/shared/catchAsync';

/**
 * Validates and coerces the incoming request against a Zod schema that may
 * describe `body`, `query`, `params`, and `cookies`. On success the parsed
 * (typed) values overwrite the originals so downstream handlers get clean data.
 */
export const validateRequest = (schema: ZodType) => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies,
    });

    const result = parsed as {
      body?: unknown;
      query?: unknown;
      params?: unknown;
      cookies?: unknown;
    };

    if (result.body !== undefined) req.body = result.body;
    if (result.query !== undefined) Object.assign(req.query, result.query);
    if (result.params !== undefined) Object.assign(req.params, result.params);

    next();
  });
};
