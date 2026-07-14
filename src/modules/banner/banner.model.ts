import mongoose, { Schema, model, type Model } from 'mongoose';
import { baseSchemaOptions } from '@/shared/model';
import { BANNER_POSITIONS, type BannerPosition } from '@/shared/constants';

export interface IBanner {
  title: string;
  subtitle?: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
  position: BannerPosition;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BannerModel = Model<IBanner>;

const bannerSchema = new Schema<IBanner, BannerModel>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    image: { type: String, required: true },
    ctaText: { type: String, trim: true },
    ctaLink: { type: String, trim: true },
    position: { type: String, enum: BANNER_POSITIONS, default: 'hero', index: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  baseSchemaOptions,
);

export const Banner =
  (mongoose.models.Banner as BannerModel) ?? model<IBanner, BannerModel>('Banner', bannerSchema);
