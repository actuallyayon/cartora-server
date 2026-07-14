import mongoose, { Schema, model, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '@/shared/model';
import {
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  type PaymentProvider,
  type PaymentStatus,
} from '@/shared/constants';

export interface IPayment {
  order: Types.ObjectId;
  user: Types.ObjectId;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string; // e.g. "card"
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  receiptUrl?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentModel = Model<IPayment>;

const paymentSchema = new Schema<IPayment, PaymentModel>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: PAYMENT_PROVIDERS, default: 'stripe' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    method: { type: String },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
    stripeChargeId: { type: String },
    receiptUrl: { type: String },
    failureReason: { type: String },
  },
  baseSchemaOptions,
);

export const Payment =
  (mongoose.models.Payment as PaymentModel) ??
  model<IPayment, PaymentModel>('Payment', paymentSchema);
