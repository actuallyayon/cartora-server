import { isValidObjectId, type Model } from 'mongoose';
import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { generateUniqueSlug } from '@/utils/slug';
import { Brand } from '@/modules/brand/brand.model';
import type { CreateBrandInput, UpdateBrandInput } from '@/modules/brand/brand.validation';

const slugModel = Brand as unknown as Model<Record<string, unknown>>;

export const createBrand = async (input: CreateBrandInput) => {
  const slug = await generateUniqueSlug(slugModel, input.name);
  return Brand.create({ ...input, slug });
};

export const listBrands = async (includeInactive = false) => {
  const filter = includeInactive ? {} : { isActive: true };
  return Brand.find(filter).sort({ name: 1 });
};

export const getBrand = async (idOrSlug: string) => {
  const query = isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const brand = await Brand.findOne(query);
  if (!brand) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Brand not found');
  }
  return brand;
};

export const updateBrand = async (id: string, input: UpdateBrandInput) => {
  const brand = await Brand.findById(id);
  if (!brand) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Brand not found');
  }
  if (input.name && input.name !== brand.name) {
    brand.slug = await generateUniqueSlug(slugModel, input.name, id);
  }
  Object.assign(brand, input);
  await brand.save();
  return brand;
};

export const deleteBrand = async (id: string) => {
  const brand = await Brand.findByIdAndDelete(id);
  if (!brand) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Brand not found');
  }
  return brand;
};
