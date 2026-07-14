import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { User } from '@/modules/user/user.model';
import type { UpdateProfileInput } from '@/modules/user/user.validation';

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
  }
  return user;
};

export const updateProfile = async (userId: string, input: UpdateProfileInput) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
  }

  // Update fields if provided
  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone;
  if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl || undefined;

  await user.save();
  return user;
};
