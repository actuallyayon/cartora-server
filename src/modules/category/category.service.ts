import type { Model } from 'mongoose';
import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { generateUniqueSlug } from '@/utils/slug';
import { isValidObjectId } from 'mongoose';
import { Category } from '@/modules/category/category.model';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/modules/category/category.validation';

// The slug helper is model-agnostic; cast keeps it reusable without `any`.
const slugModel = Category as unknown as Model<Record<string, unknown>>;

export const createCategory = async (input: CreateCategoryInput) => {
  const slug = await generateUniqueSlug(slugModel, input.name);
  return Category.create({ ...input, slug });
};

export const listCategories = async (includeInactive = false) => {
  const filter = includeInactive ? {} : { isActive: true };
  return Category.find(filter).sort({ name: 1 });
};

export const getCategory = async (idOrSlug: string) => {
  const query = isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const category = await Category.findOne(query);
  if (!category) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Category not found');
  }
  return category;
};

export const updateCategory = async (id: string, input: UpdateCategoryInput) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Category not found');
  }

  if (input.name && input.name !== category.name) {
    category.slug = await generateUniqueSlug(slugModel, input.name, id);
  }
  Object.assign(category, input);
  await category.save();
  return category;
};

export const deleteCategory = async (id: string) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Category not found');
  }
  return category;
};
