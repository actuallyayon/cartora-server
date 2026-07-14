import mongoose, { Schema, model, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '@/shared/model';

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  selectedVariant?: { name: string; value: string };
  unitPrice: number; // snapshot at add-time; re-validated at checkout
}

export interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type CartModel = Model<ICart>;

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    selectedVariant: {
      type: new Schema(
        { name: { type: String, required: true }, value: { type: String, required: true } },
        { _id: false },
      ),
      required: false,
    },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart, CartModel>(
  {
    // One active cart per user.
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  baseSchemaOptions,
);

export const Cart =
  (mongoose.models.Cart as CartModel) ?? model<ICart, CartModel>('Cart', cartSchema);
