import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { verifyAccessToken } from '@/shared/jwt';
import { ACCESS_COOKIE } from '@/shared/cookies';
import type { UserRole } from '@/shared/constants';
import { User } from '@/modules/user/user.model';

/** Pull the access token from the httpOnly cookie or a Bearer header. */
const extractToken = (req: Request): string | null => {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);

  return null;
};

/**
 * Verifies the access token, confirms the user still exists and is active,
 * and attaches `{ id, role, email }` to `req.user`.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid or expired session');
    }

    const user = await User.findById(payload.sub).lean();
    if (!user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'User no longer exists');
    }
    if (user.status === 'banned') {
      throw new ApiError(HttpStatus.FORBIDDEN, 'Your account has been suspended');
    }

    req.user = { id: String(user._id), role: user.role, email: user.email };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Best-effort auth for public routes: if a valid token is present, attach
 * `req.user`; otherwise continue as an anonymous request. Lets list/detail
 * endpoints tailor results for admins (e.g. include inactive items) without
 * blocking guests.
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) {
      next();
      return;
    }
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).lean();
    if (user && user.status !== 'banned') {
      req.user = { id: String(user._id), role: user.role, email: user.email };
    }
  } catch {
    // Ignore bad/expired tokens for optional auth.
  }
  next();
};

/**
 * Role guard. Use after `authenticate`, e.g. `authorize('admin')`.
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ApiError(HttpStatus.FORBIDDEN, 'You do not have permission to do this'));
      return;
    }
    next();
  };
};
