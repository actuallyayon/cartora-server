import mongoose, { Schema, model, type Model } from 'mongoose';
import { baseSchemaOptions } from '@/shared/model';

export interface IBrand {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BrandModel = Model<IBrand>;

const brandSchema = new Schema<IBrand, BrandModel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    logo: { type: String },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  baseSchemaOptions,
);

export const Brand =
  (mongoose.models.Brand as BrandModel) ?? model<IBrand, BrandModel>('Brand', brandSchema);
