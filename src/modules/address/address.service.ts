import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { Address } from '@/modules/address/address.model';
import type { CreateAddressInput, UpdateAddressInput } from '@/modules/address/address.validation';

export const getUserAddresses = async (userId: string) => {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
};

export const createAddress = async (userId: string, input: CreateAddressInput) => {
  // Enforce an address limit (e.g. max 10 addresses per account)
  const count = await Address.countDocuments({ user: userId });
  if (count >= 10) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'You can save a maximum of 10 addresses');
  }

  // Force default address on the very first address record created
  const isFirstAddress = count === 0;
  const isDefault = isFirstAddress ? true : Boolean(input.isDefault);

  if (isDefault) {
    // Unset current default addresses
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }

  const address = await Address.create({
    user: userId,
    ...input,
    isDefault,
  });

  return address;
};

export const updateAddress = async (addressId: string, userId: string, input: UpdateAddressInput) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Address not found');
  }

  if (input.isDefault) {
    await Address.updateMany(
      { user: userId, _id: { $ne: addressId } },
      { $set: { isDefault: false } }
    );
  }

  Object.assign(address, input);
  await address.save();
  return address;
};

export const deleteAddress = async (addressId: string, userId: string) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Address not found');
  }

  const wasDefault = address.isDefault;
  await Address.deleteOne({ _id: addressId });

  // If we deleted the default address, set another saved address as the new default
  if (wasDefault) {
    const nextDefault = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
    if (nextDefault) {
      nextDefault.isDefault = true;
      await nextDefault.save();
    }
  }

  return { success: true };
};

export const setDefaultAddress = async (addressId: string, userId: string) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Address not found');
  }

  // Reset current defaults
  await Address.updateMany({ user: userId }, { $set: { isDefault: false } });

  address.isDefault = true;
  await address.save();
  return address;
};
