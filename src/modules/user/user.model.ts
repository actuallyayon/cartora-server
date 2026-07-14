import mongoose, { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { baseSchemaOptions } from '@/shared/model';
import {
  AUTH_PROVIDERS,
  USER_ROLES,
  USER_STATUSES,
  type AuthProvider,
  type UserRole,
  type UserStatus,
} from '@/shared/constants';

export interface IUser {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  phone?: string;
  authProvider: AuthProvider;
  googleId?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;
export type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // `select: false` keeps the hash out of every query result by default.
    password: { type: String, select: false, minlength: 6 },
    role: { type: String, enum: USER_ROLES, default: 'customer', index: true },
    status: { type: String, enum: USER_STATUSES, default: 'active', index: true },
    avatarUrl: { type: String },
    phone: { type: String, trim: true },
    authProvider: { type: String, enum: AUTH_PROVIDERS, default: 'local' },
    googleId: { type: String, index: true, sparse: true },
    lastLoginAt: { type: Date },
  },
  baseSchemaOptions,
);

// Hash the password whenever it is set/changed. Social accounts have no password.
// Async hook: Mongoose awaits the returned promise, so no `next` callback is needed.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.method('comparePassword', function comparePassword(candidate: string) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
});

// Reuse an already-registered model on watch reloads / serverless re-imports.
export const User =
  (mongoose.models.User as UserModel) ?? model<IUser, UserModel>('User', userSchema);

export type UserId = Types.ObjectId;
