import type { Types } from 'mongoose';
import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { Review } from '@/modules/review/review.model';
import { Product } from '@/modules/product/product.model';
import type { CreateReviewInput } from '@/modules/review/review.validation';

/**
 * Recalculates average rating and review counts on the Product document
 */
export const recalculateProductRating = async (productId: string | Types.ObjectId): Promise<void> => {
  const reviews = await Review.find({ product: productId });
  
  const count = reviews.length;
  let average = 0;

  if (count > 0) {
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    average = Math.round((sum / count) * 10) / 10; // Rounded to 1 decimal place
  }

  await Product.findByIdAndUpdate(productId, {
    $set: {
      'rating.average': average,
      'rating.count': count,
    },
  });
};

export const createReview = async (userId: string, input: CreateReviewInput) => {
  const product = await Product.findById(input.product);
  if (!product || !product.isActive) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Product not found or inactive');
  }

  // Check if user already submitted a review for this product
  const existingReview = await Review.findOne({ product: input.product, user: userId });
  if (existingReview) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'You have already reviewed this product.');
  }

  const review = await Review.create({
    product: input.product,
    user: userId,
    rating: input.rating,
    comment: input.comment,
  });

  // Re-calculate average scores on the parent Product
  await recalculateProductRating(input.product);

  const populated = await review.populate('user', 'name email');
  return populated;
};

export const getProductReviews = async (
  productId: string,
  page: number = 1,
  limit: number = 10
) => {
  const filter = { product: productId };
  const total = await Review.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  const items = await Review.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const deleteReview = async (reviewId: string, userId: string, userRole: string) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Review not found');
  }

  // Author or admin can delete
  if (userRole !== 'admin' && review.user.toString() !== userId) {
    throw new ApiError(HttpStatus.FORBIDDEN, 'You do not have permission to delete this review');
  }

  await Review.findByIdAndDelete(reviewId);

  // Recompute scores on the parent Product
  await recalculateProductRating(review.product);

  return review;
};
