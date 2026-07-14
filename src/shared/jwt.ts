import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import type { UserRole } from '@/shared/constants';

/** Claims we embed in both tokens. `sub` is the user id (JWT standard). */
export interface JwtPayload {
  sub: string;
  role: UserRole;
  email: string;
}

type ExpiresIn = SignOptions['expiresIn'];

export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as ExpiresIn,
  });

export const signRefreshToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as ExpiresIn,
  });

const decode = (token: string, secret: string): JwtPayload => {
  const decoded = jwt.verify(token, secret);
  // `verify` returns string for non-object payloads; ours is always an object.
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }
  return {
    sub: String(decoded.sub),
    role: decoded.role as UserRole,
    email: String(decoded.email),
  };
};

export const verifyAccessToken = (token: string): JwtPayload =>
  decode(token, env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token: string): JwtPayload =>
  decode(token, env.JWT_REFRESH_SECRET);
