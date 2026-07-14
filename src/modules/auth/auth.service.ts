import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/shared/jwt';
import { User, type UserDocument } from '@/modules/user/user.model';
import type { LoginInput, RegisterInput } from '@/modules/auth/auth.validation';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: UserDocument;
  tokens: TokenPair;
}

const buildTokens = (user: UserDocument): TokenPair => {
  const payload = { sub: user.id as string, role: user.role, email: user.email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

export const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new ApiError(HttpStatus.CONFLICT, 'An account with this email already exists');
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    authProvider: 'local',
  });

  return { user, tokens: buildTokens(user) };
};

export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  // Password is `select: false`, so pull it explicitly for comparison.
  const user = await User.findOne({ email: input.email }).select('+password');
  if (!user || !user.password) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  const matches = await user.comparePassword(input.password);
  if (!matches) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  if (user.status === 'banned') {
    throw new ApiError(HttpStatus.FORBIDDEN, 'Your account has been suspended');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return { user, tokens: buildTokens(user) };
};

export const refreshSession = async (refreshToken: string | undefined): Promise<AuthResult> => {
  if (!refreshToken) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'No refresh token provided');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'User no longer exists');
  }
  if (user.status === 'banned') {
    throw new ApiError(HttpStatus.FORBIDDEN, 'Your account has been suspended');
  }

  return { user, tokens: buildTokens(user) };
};

export const getCurrentUser = async (userId: string): Promise<UserDocument> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
  }
  return user;
};

/**
 * Google Sign-In: verify the credential (ID token) that the frontend received
 * from the Google popup, then find-or-create the user in our database.
 */
export const googleLogin = async (credential: string): Promise<AuthResult> => {
  const { OAuth2Client } = await import('google-auth-library');
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;

  if (!clientId) {
    throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Google OAuth is not configured');
  }

  const client = new OAuth2Client(clientId);

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
  } catch {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid Google credential');
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Google token missing email');
  }

  const { email, name, sub: googleId, picture } = payload;

  // Try to find by googleId first, then by email.
  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      // Link Google to existing local account
      user.googleId = googleId;
      user.authProvider = 'google';
      if (picture && !user.avatarUrl) user.avatarUrl = picture;
    } else {
      // Brand-new user
      user = new User({
        name: name ?? email.split('@')[0],
        email,
        googleId,
        authProvider: 'google',
        avatarUrl: picture,
      });
    }
  }

  if (user.status === 'banned') {
    throw new ApiError(HttpStatus.FORBIDDEN, 'Your account has been suspended');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return { user, tokens: buildTokens(user) };
};
