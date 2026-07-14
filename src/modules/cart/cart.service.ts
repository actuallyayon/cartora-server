import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { Cart } from '@/modules/cart/cart.model';
import { Product } from '@/modules/product/product.model';
import type { AddToCartInput } from '@/modules/cart/cart.validation';

/** Shape returned to the client: populated line items + computed totals. */
export interface CartView {
  id: string | null;
  items: {
    product: {
      id: string;
      name: string;
      slug: string;
      thumbnail: string;
      price: number;
      currency: string;
      stock: number;
    };
    quantity: number;
    selectedVariant?: { name: string; value: string };
    lineTotal: number;
  }[];
  itemCount: number;
  subtotal: number;
  currency: string;
}

const getOrCreateCart = async (userId: string) => {
  const existing = await Cart.findOne({ user: userId });
  if (existing) return existing;
  return Cart.create({ user: userId, items: [] });
};

/** Build the client view from a cart, pricing lines at the CURRENT product price. */
export const buildCartView = async (userId: string): Promise<CartView> => {
  const cart = await Cart.findOne({ user: userId }).populate(
    'items.product',
    'name slug thumbnail price currency stock isActive',
  );

  if (!cart || cart.items.length === 0) {
    return {
      id: cart ? String(cart._id) : null,
      items: [],
      itemCount: 0,
      subtotal: 0,
      currency: 'USD',
    };
  }

  const items: CartView['items'] = [];
  let subtotal = 0;
  let itemCount = 0;
  let currency = 'USD';

  for (const item of cart.items) {
    // Populated product is an object; skip if the product was deleted.
    const product = item.product as unknown as {
      _id: unknown;
      name?: string;
      slug?: string;
      thumbnail?: string;
      price?: number;
      currency?: string;
      stock?: number;
      isActive?: boolean;
    } | null;
    if (!product || product.name == null || product.isActive === false) continue;

    const price = product.price ?? 0;
    const lineTotal = price * item.quantity;
    subtotal += lineTotal;
    itemCount += item.quantity;
    currency = product.currency ?? 'USD';

    items.push({
      product: {
        id: String(product._id),
        name: product.name,
        slug: product.slug ?? '',
        thumbnail: product.thumbnail ?? '',
        price,
        currency,
        stock: product.stock ?? 0,
      },
      quantity: item.quantity,
      selectedVariant: item.selectedVariant,
      lineTotal,
    });
  }

  return {
    id: String(cart._id),
    items,
    itemCount,
    subtotal: Math.round(subtotal * 100) / 100,
    currency,
  };
};

export const addToCart = async (userId: string, input: AddToCartInput): Promise<CartView> => {
  const product = await Product.findById(input.productId);
  if (!product || !product.isActive) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Product not found');
  }
  if (product.stock < input.quantity) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Not enough stock available');
  }

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find(
    (i) =>
      String(i.product) === input.productId &&
      i.selectedVariant?.value === input.selectedVariant?.value,
  );

  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + input.quantity);
  } else {
    cart.items.push({
      product: product._id,
      quantity: input.quantity,
      selectedVariant: input.selectedVariant,
      unitPrice: product.price,
    });
  }
  await cart.save();
  return buildCartView(userId);
};

export const updateCartItem = async (
  userId: string,
  productId: string,
  quantity: number,
): Promise<CartView> => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(HttpStatus.NOT_FOUND, 'Cart not found');

  const item = cart.items.find((i) => String(i.product) === productId);
  if (!item) throw new ApiError(HttpStatus.NOT_FOUND, 'Item not in cart');

  item.quantity = quantity;
  await cart.save();
  return buildCartView(userId);
};

export const removeCartItem = async (userId: string, productId: string): Promise<CartView> => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(HttpStatus.NOT_FOUND, 'Cart not found');

  cart.items = cart.items.filter((i) => String(i.product) !== productId);
  await cart.save();
  return buildCartView(userId);
};

export const clearCart = async (userId: string): Promise<CartView> => {
  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
  return buildCartView(userId);
};
