import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { Notification } from '@/modules/notification/notification.model';
import type { NotificationType } from '@/shared/constants';

export const getUserNotifications = async (userId: string) => {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOne({ _id: notificationId, user: userId });
  if (!notification) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Notification not found');
  }

  notification.isRead = true;
  await notification.save();
  return notification;
};

export const markAllAsRead = async (userId: string) => {
  await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
  return { success: true };
};

export const createNotification = async (params: {
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) => {
  return Notification.create(params);
};
