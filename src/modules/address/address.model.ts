import mongoose, { Schema, model, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '@/shared/model';
import { ADDRESS_TYPES, type AddressType } from '@/shared/constants';

export interface IAddress {
  user: Types.ObjectId;
  label?: string; // e.g. "Home", "Work"
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  type: AddressType;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AddressModel = Model<IAddress>;

const addressSchema = new Schema<IAddress, AddressModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    type: { type: String, enum: ADDRESS_TYPES, default: 'shipping' },
    isDefault: { type: Boolean, default: false },
  },
  baseSchemaOptions,
);

export const Address =
  (mongoose.models.Address as AddressModel) ??
  model<IAddress, AddressModel>('Address', addressSchema);
