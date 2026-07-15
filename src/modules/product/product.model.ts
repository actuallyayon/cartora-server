import mongoose, { Schema, model, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '@/shared/model';

export interface IProductVariant {
  name: string; // e.g. "Color" or "Size"
  value: string; // e.g. "Graphite" or "XL"
  priceDelta: number; // added to base price when selected
  stock: number;
  sku?: string;
}

export interface IProductSpec {
  key: string;
  value: string;
}

export interface IProductRating {
  average: number;
  count: number;
}

export interface IProduct {
  name: string;
  slug: string;
  description: string;
  richDescription?: string;
  brand?: Types.ObjectId;
  category: Types.ObjectId;
  price: number;
  compareAtPrice?: number;
  currency: string;
  thumbnail: string;
  images: string[];
  sku: string;
  stock: number;
  variants: IProductVariant[];
  specs: IProductSpec[];
  tags: string[];
  rating: IProductRating;
  soldCount: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductModel = Model<IProduct>;

const variantSchema = new Schema<IProductVariant>(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    priceDelta: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true },
  },
  { _id: false },
);

const specSchema = new Schema<IProductSpec>(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct, ProductModel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    richDescription: { type: String },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    thumbnail: { type: String, required: true },
    images: { type: [String], default: [] },
    sku: { type: String, required: true, unique: true, trim: true, index: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    variants: { type: [variantSchema], default: [] },
    specs: { type: [specSchema], default: [] },
    tags: { type: [String], default: [], index: true },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    soldCount: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  baseSchemaOptions,
);

// Full-text search across the fields users actually search by.
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
// Common listing sorts/filters.
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

export const Product =
  (mongoose.models.Product as ProductModel) ??
  model<IProduct, ProductModel>('Product', productSchema);
