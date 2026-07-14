import type { CookieOptions, Response } from 'express';
import { isProduction } from '@/config/env';

export const ACCESS_COOKIE = 'cartora_access';
export const REFRESH_COOKIE = 'cartora_refresh';

const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Cookie options for the auth tokens.
 * - `httpOnly` so JS can't read them (XSS-safe).
 * - In production the client and API live on different domains, so cookies must
 *   be `SameSite=None; Secure`. Locally (same-site localhost) `Lax` works and
 *   avoids requiring HTTPS.
 */
const baseCookie = (maxAge: number): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge,
  path: '/',
});

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie(ACCESS_COOKIE, accessToken, baseCookie(ACCESS_MAX_AGE));
  res.cookie(REFRESH_COOKIE, refreshToken, baseCookie(REFRESH_MAX_AGE));
};

export const clearAuthCookies = (res: Response): void => {
  const opts = { ...baseCookie(0) };
  delete opts.maxAge;
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
};
