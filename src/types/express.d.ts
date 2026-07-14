import type { Types } from 'mongoose';

/**
 * Augments Express' Request with the authenticated user, populated by the
 * auth middleware in Step 3. Declared now so downstream typing stays clean.
 */
declare global {
  namespace Express {
    interface AuthUser {
      id: Types.ObjectId | string;
      role: 'customer' | 'admin';
      email: string;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
