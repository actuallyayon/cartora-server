import mongoose, { Schema, model, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '@/shared/model';

/**
 * A line item within an order. Product details are snapshotted at purchase time
 * so historical orders stay accurate even if the product later changes or is deleted.
 */
export interface IOrderItem {
  order: Types.ObjectId;
  product?: Types.ObjectId;
  name: string;
  thumbnail: string;
  sku: string;
  selectedVariant?: { name: string; value: string };
  unitPrice: number;
  quantity: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderItemModel = Model<IOrderItem>;

const orderItemSchema = new Schema<IOrderItem, OrderItemModel>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    thumbnail: { type: String, required: true },
    sku: { type: String, required: true },
    selectedVariant: {
      type: new Schema(
        { name: { type: String, required: true }, value: { type: String, required: true } },
        { _id: false },
      ),
      required: false,
    },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  baseSchemaOptions,
);

export const OrderItem =
  (mongoose.models.OrderItem as OrderItemModel) ??
  model<IOrderItem, OrderItemModel>('OrderItem', orderItemSchema);
