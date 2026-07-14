import type { Request, Response } from 'express';
import { catchAsync } from '@/shared/catchAsync';
import { sendResponse } from '@/shared/sendResponse';
import { HttpStatus } from '@/shared/httpStatus';
import { ApiError } from '@/shared/ApiError';
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from '@/shared/cookies';
import {
  getCurrentUser,
  googleLogin,
  loginUser,
  refreshSession,
  registerUser,
} from '@/modules/auth/auth.service';

export const register = catchAsync(async (req: Request, res: Response) => {
  const { user, tokens } = await registerUser(req.body);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    message: 'Account created successfully',
    data: user,
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { user, tokens } = await loginUser(req.body);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Logged in successfully',
    data: user,
  });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  const { user, tokens } = await refreshSession(token);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Session refreshed',
    data: user,
  });
});

export const logout = catchAsync(async (_req: Request, res: Response) => {
  clearAuthCookies(res);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Logged out successfully',
    data: null,
  });
});

export const me = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const user = await getCurrentUser(req.user.id as string);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Current user',
    data: user,
  });
});

export const googleSignIn = catchAsync(async (req: Request, res: Response) => {
  const { credential } = req.body as { credential?: string };
  if (!credential) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Google credential is required');
  }
  const { user, tokens } = await googleLogin(credential);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Signed in with Google',
    data: user,
  });
});
