import mongoose, { Schema, model, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '@/shared/model';

export interface IWishlist {
  user: Types.ObjectId;
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type WishlistModel = Model<IWishlist>;

const wishlistSchema = new Schema<IWishlist, WishlistModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  baseSchemaOptions,
);

export const Wishlist =
  (mongoose.models.Wishlist as WishlistModel) ??
  model<IWishlist, WishlistModel>('Wishlist', wishlistSchema);
