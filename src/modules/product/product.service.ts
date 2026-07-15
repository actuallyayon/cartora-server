import { isValidObjectId } from 'mongoose';
import type { Model, QueryFilter } from 'mongoose';
import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { generateUniqueSlug } from '@/utils/slug';
import { getPagination } from '@/shared/pagination';
import { Product, type IProduct } from '@/modules/product/product.model';
import { Category } from '@/modules/category/category.model';
import { Brand } from '@/modules/brand/brand.model';
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from '@/modules/product/product.validation';

type GenericModel = Model<Record<string, unknown>>;
const slugModel = Product as unknown as GenericModel;
const categoryModel = Category as unknown as GenericModel;
const brandModel = Brand as unknown as GenericModel;

/** Resolve a category/brand reference that may be an id or a slug → id string. */
const resolveRefId = async (model: GenericModel, idOrSlug: string): Promise<string | null> => {
  if (isValidObjectId(idOrSlug)) return idOrSlug;
  const doc = await model.findOne({ slug: idOrSlug }).select('_id').lean();
  return doc ? String(doc._id) : null;
};

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { 'rating.average': -1 },
  popular: { soldCount: -1 },
};

// Mongoose v9 renamed FilterQuery → QueryFilter.
type ProductFilter = QueryFilter<IProduct>;

export const listProducts = async (query: ListProductsQuery, isAdmin = false) => {
  const filter: Record<string, unknown> = {};

  if (!(isAdmin && query.includeInactive === 'true')) {
    filter.isActive = true;
  }

  if (query.search) {
    const rx = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { tags: rx }];
  }

  if (query.category) {
    const id = await resolveRefId(categoryModel, query.category);
    filter.category = id ?? '__none__';
  }
  if (query.brand) {
    const id = await resolveRefId(brandModel, query.brand);
    filter.brand = id ?? '__none__';
  }

  if (query.minPrice != null || query.maxPrice != null) {
    const price: Record<string, number> = {};
    if (query.minPrice != null) price.$gte = query.minPrice;
    if (query.maxPrice != null) price.$lte = query.maxPrice;
    filter.price = price;
  }
  if (query.minRating != null) {
    filter['rating.average'] = { $gte: query.minRating };
  }
  if (query.featured === 'true') {
    filter.isFeatured = true;
  }
  if (query.newArrival === 'true') {
    filter.isNewArrival = true;
  }
  if (query.bestSeller === 'true') {
    filter.isBestSeller = true;
  }

  const { page, limit, skip } = getPagination(query.page, query.limit);
  const sort = SORT_MAP[query.sort ?? 'newest'] ?? SORT_MAP.newest;
  const where = filter as unknown as ProductFilter;

  const [items, total] = await Promise.all([
    Product.find(where)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(where),
  ]);

  return { items, total, page, limit };
};

export const getProduct = async (idOrSlug: string) => {
  const query = isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const product = await Product.findOne(query)
    .populate('category', 'name slug')
    .populate('brand', 'name slug');
  if (!product) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Product not found');
  }
  return product;
};

export const getRelatedProducts = async (idOrSlug: string, limit = 4) => {
  const product = await getProduct(idOrSlug);
  return Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .sort({ soldCount: -1 })
    .limit(limit)
    .populate('category', 'name slug');
};

const assertCategoryExists = async (categoryId: string): Promise<void> => {
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Selected category does not exist');
  }
};

export const createProduct = async (input: CreateProductInput) => {
  await assertCategoryExists(input.category);
  const slug = await generateUniqueSlug(slugModel, input.name);
  try {
    return await Product.create({ ...input, slug });
  } catch (error) {
    if (error !== null && typeof error === 'object' && 'code' in error && error.code === 11000) {
      throw new ApiError(HttpStatus.CONFLICT, 'A product with this SKU already exists');
    }
    throw error;
  }
};

export const updateProduct = async (id: string, input: UpdateProductInput) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Product not found');
  }
  if (input.category) {
    await assertCategoryExists(input.category);
  }
  if (input.name && input.name !== product.name) {
    product.slug = await generateUniqueSlug(slugModel, input.name, id);
  }
  Object.assign(product, input);
  await product.save();
  return product;
};

export const deleteProduct = async (id: string) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Product not found');
  }
  return product;
};
