import mongoose, { Schema, model, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '@/shared/model';
import { NOTIFICATION_TYPES, type NotificationType } from '@/shared/constants';

export interface INotification {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationModel = Model<INotification>;

const notificationSchema = new Schema<INotification, NotificationModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: 'system' },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true },
  },
  baseSchemaOptions,
);

notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification =
  (mongoose.models.Notification as NotificationModel) ??
  model<INotification, NotificationModel>('Notification', notificationSchema);
