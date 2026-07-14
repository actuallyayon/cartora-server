import mongoose, { Schema, model, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '@/shared/model';

export interface IReview {
  id: string;
  product: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewModel = Model<IReview>;

const reviewSchema = new Schema<IReview, ReviewModel>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 3, maxlength: 1000 },
  },
  baseSchemaOptions
);

// Prevent users from posting multiple reviews on the same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Sort reviews by date descending
reviewSchema.index({ createdAt: -1 });

export const Review =
  (mongoose.models.Review as ReviewModel) ??
  model<IReview, ReviewModel>('Review', reviewSchema);
