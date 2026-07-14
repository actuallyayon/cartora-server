import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { Coupon } from '@/modules/coupon/coupon.model';
import { Order } from '@/modules/order/order.model';
import type { CreateCouponInput, UpdateCouponInput } from '@/modules/coupon/coupon.validation';

export const createCoupon = async (input: CreateCouponInput) => {
  const code = input.code.toUpperCase();
  const existing = await Coupon.findOne({ code });
  if (existing) {
    throw new ApiError(HttpStatus.CONFLICT, `Coupon code “${code}” already exists`);
  }
  return Coupon.create({ ...input, code });
};

export const listCoupons = async (includeInactive = false) => {
  const filter = includeInactive ? {} : { isActive: true };
  return Coupon.find(filter).sort({ createdAt: -1 });
};

export const getCoupon = async (id: string) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Coupon not found');
  }
  return coupon;
};

export const updateCoupon = async (id: string, input: UpdateCouponInput) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Coupon not found');
  }
  if (input.code && input.code !== coupon.code) {
    const code = input.code.toUpperCase();
    const existing = await Coupon.findOne({ code });
    if (existing && String(existing._id) !== id) {
      throw new ApiError(HttpStatus.CONFLICT, `Coupon code “${code}” already exists`);
    }
  }
  Object.assign(coupon, input);
  await coupon.save();
  return coupon;
};

export const deleteCoupon = async (id: string) => {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Coupon not found');
  }
  return coupon;
};

export const validateCoupon = async (code: string, subtotal: number, userId: string) => {
  const normalizedCode = code.toUpperCase();
  const coupon = await Coupon.findOne({ code: normalizedCode });
  if (!coupon) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Invalid coupon code');
  }

  if (!coupon.isActive) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Coupon is inactive');
  }

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Coupon campaign has not started yet');
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Coupon has expired');
  }

  if (coupon.usageLimit !== undefined && coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Coupon usage limit has been reached');
  }

  if (subtotal < coupon.minPurchase) {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      `Minimum purchase amount of $${coupon.minPurchase} is required for this coupon`
    );
  }

  // Verify per-user usage limits
  const userUsage = await Order.countDocuments({
    user: userId,
    'appliedCoupon.code': normalizedCode,
    paymentStatus: { $ne: 'failed' },
  });

  if (userUsage >= coupon.perUserLimit) {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      'You have reached the maximum redemptions for this coupon'
    );
  }

  // Calculate discount amount
  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = subtotal * (coupon.discountValue / 100);
    if (coupon.maxDiscount !== undefined && coupon.maxDiscount !== null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else if (coupon.discountType === 'fixed') {
    discount = Math.min(coupon.discountValue, subtotal);
  }

  // Rounded to two decimal digits
  discount = Math.round(discount * 100) / 100;

  return {
    coupon,
    discount,
  };
};
