import type { Request } from 'express';

/**
 * Read a route param as a plain string. Express 5's param values are typed
 * `string | string[]`; route params are always single strings in practice.
 */
export const getParam = (req: Request, key: string): string => {
  const value = req.params[key];
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
};
