import mongoose, { Schema, model, type Model } from 'mongoose';
import { baseSchemaOptions } from '@/shared/model';
import { DISCOUNT_TYPES, type DiscountType } from '@/shared/constants';

export interface ICoupon {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number; // caps a percentage discount
  usageLimit?: number; // total redemptions allowed (null = unlimited)
  usedCount: number;
  perUserLimit: number;
  startsAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CouponModel = Model<ICoupon>;

const couponSchema = new Schema<ICoupon, CouponModel>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, trim: true },
    discountType: { type: String, enum: DISCOUNT_TYPES, required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minPurchase: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    usageLimit: { type: Number, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  baseSchemaOptions,
);

export const Coupon =
  (mongoose.models.Coupon as CouponModel) ?? model<ICoupon, CouponModel>('Coupon', couponSchema);
