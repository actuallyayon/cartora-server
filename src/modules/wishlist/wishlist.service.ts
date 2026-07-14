import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { Wishlist } from '@/modules/wishlist/wishlist.model';
import { Product } from '@/modules/product/product.model';

const PRODUCT_FIELDS =
  'name slug thumbnail price compareAtPrice currency stock rating category isActive';

const getOrCreate = async (userId: string) => {
  const existing = await Wishlist.findOne({ user: userId });
  if (existing) return existing;
  return Wishlist.create({ user: userId, products: [] });
};

/** Full populated products for the wishlist page (card-ready). */
export const getWishlistProducts = async (userId: string) => {
  const wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: 'products',
    select: PRODUCT_FIELDS,
    match: { isActive: true },
    populate: { path: 'category', select: 'name slug' },
  });
  return wishlist?.products ?? [];
};

/** Lightweight id list used to render heart state across listings. */
export const getWishlistIds = async (userId: string): Promise<string[]> => {
  const wishlist = await Wishlist.findOne({ user: userId }).select('products').lean();
  return (wishlist?.products ?? []).map((p) => String(p));
};

export const addToWishlist = async (userId: string, productId: string): Promise<string[]> => {
  const product = await Product.exists({ _id: productId, isActive: true });
  if (!product) throw new ApiError(HttpStatus.NOT_FOUND, 'Product not found');

  const wishlist = await getOrCreate(userId);
  await wishlist.updateOne({ $addToSet: { products: productId } });
  return getWishlistIds(userId);
};

export const removeFromWishlist = async (userId: string, productId: string): Promise<string[]> => {
  await Wishlist.findOneAndUpdate({ user: userId }, { $pull: { products: productId } });
  return getWishlistIds(userId);
};
