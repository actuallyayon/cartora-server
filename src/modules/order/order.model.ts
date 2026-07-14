import mongoose, { Schema, model, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '@/shared/model';
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type OrderStatus,
  type PaymentStatus,
} from '@/shared/constants';

/** Address is snapshotted onto the order so it never changes retroactively. */
export interface IShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface IAppliedCoupon {
  code: string;
  discount: number;
}

export interface IOrder {
  orderNumber: string;
  user: Types.ObjectId;
  items: Types.ObjectId[]; // refs to OrderItem
  itemsCount: number;
  shippingAddress: IShippingAddress;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  appliedCoupon?: IAppliedCoupon;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  payment?: Types.ObjectId;
  placedAt: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderModel = Model<IOrder>;

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder, OrderModel>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [{ type: Schema.Types.ObjectId, ref: 'OrderItem' }],
    itemsCount: { type: Number, required: true, min: 0 },
    shippingAddress: { type: shippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    appliedCoupon: {
      type: new Schema(
        { code: { type: String, required: true }, discount: { type: Number, required: true } },
        { _id: false },
      ),
      required: false,
    },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    placedAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date },
  },
  baseSchemaOptions,
);

orderSchema.index({ user: 1, createdAt: -1 });

export const Order =
  (mongoose.models.Order as OrderModel) ?? model<IOrder, OrderModel>('Order', orderSchema);
