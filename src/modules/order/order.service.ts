import Stripe from 'stripe';
import type { Types } from 'mongoose';
import { env } from '@/config/env';
import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { Cart } from '@/modules/cart/cart.model';
import type { IProduct } from '@/modules/product/product.model';
import { Order } from '@/modules/order/order.model';
import { OrderItem } from '@/modules/order/orderItem.model';
import { Payment } from '@/modules/payment/payment.model';
import { validateCoupon } from '@/modules/coupon/coupon.service';
import type { CheckoutInput } from '@/modules/order/order.validation';
import { createNotification } from '@/modules/notification/notification.service';
import { processPaymentIntentSuccess } from '@/modules/payment/payment.service';

// Initialize Stripe (if secret key is set, otherwise fall back to dummy string so compiler passes)
const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'dummy_stripe_secret_key', {
  apiVersion: '2025-01-27.acacia' as unknown as Stripe.StripeConfig['apiVersion'],
});

export const processCheckout = async (userId: string, input: CheckoutInput) => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Stripe integration is not configured. Please define STRIPE_SECRET_KEY.'
    );
  }

  // 1. Fetch user's cart and populate product details
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Your shopping cart is empty');
  }

  // 2. Validate product stock and prices
  let subtotal = 0;
  const itemsToCreate = [];

  for (const item of cart.items) {
    const product = item.product as unknown as IProduct & { _id: Types.ObjectId }; // Cast populated mongoose ref

    if (!product || !product.isActive) {
      continue; // Skip invalid products (matches cart view behavior)
    }

    if (product.stock < item.quantity) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        `Only ${product.stock} units of “${product.name}” are in stock (requested ${item.quantity}).`
      );
    }

    const itemSubtotal = product.price * item.quantity;
    subtotal += itemSubtotal;

    itemsToCreate.push({
      productId: product._id,
      name: product.name,
      thumbnail: product.thumbnail,
      sku: product.sku,
      selectedVariant: item.selectedVariant,
      unitPrice: product.price,
      quantity: item.quantity,
      subtotal: itemSubtotal,
    });
  }

  if (itemsToCreate.length === 0) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'None of the items in your cart are currently available.');
  }

  // 3. Apply coupon validation if present
  let discount = 0;
  if (input.couponCode) {
    const validation = await validateCoupon(input.couponCode, subtotal, userId);
    discount = validation.discount;
  }

  const taxableAmount = Math.max(0, subtotal - discount);

  // 4. Calculate Tax (flat 5%) and Shipping (flat $15, free if purchase is >= $150)
  const tax = Math.round(taxableAmount * 0.05 * 100) / 100;
  const shippingCost = taxableAmount >= 150 ? 0 : 15;
  const total = Math.round((taxableAmount + tax + shippingCost) * 100) / 100;

  // 5. Generate unique order number
  const orderNumber = `OR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 6. Request Stripe PaymentIntent creation
  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // convert dollars to cents
      currency: 'usd',
      metadata: {
        userId,
        orderNumber,
        couponCode: input.couponCode || '',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      `Stripe checkout error: ${message}`
    );
  }

  const itemsCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // 7. Store order records in DB
  const order = await Order.create({
    orderNumber,
    user: userId,
    itemsCount,
    shippingAddress: input.shippingAddress,
    subtotal,
    discount,
    shippingCost,
    tax,
    total,
    appliedCoupon: input.couponCode ? { code: input.couponCode, discount } : undefined,
    orderStatus: 'pending',
    paymentStatus: 'pending',
    items: [],
  });

  // Create order line items
  const createdItems: Types.ObjectId[] = [];
  for (const itemData of itemsToCreate) {
    const orderItem = await OrderItem.create({
      order: order._id,
      product: itemData.productId,
      name: itemData.name,
      thumbnail: itemData.thumbnail,
      sku: itemData.sku,
      selectedVariant: itemData.selectedVariant,
      unitPrice: itemData.unitPrice,
      quantity: itemData.quantity,
      subtotal: itemData.subtotal,
    });
    createdItems.push(orderItem._id);
  }

  // Link items to the main order
  order.items = createdItems;
  await order.save();

  // 8. Create the Payment tracking document
  const payment = await Payment.create({
    order: order._id,
    user: userId,
    provider: 'stripe',
    amount: total,
    currency: 'USD',
    status: 'pending',
    stripePaymentIntentId: paymentIntent.id,
  });

  // Link payment back to the order
  order.payment = payment._id as Types.ObjectId;
  await order.save();

  return {
    clientSecret: paymentIntent.client_secret,
    orderNumber,
    total,
  };
};

export const getOrderDetails = async (orderNumber: string, userId: string) => {
  const order = await Order.findOne({ orderNumber, user: userId })
    .populate('items')
    .populate('payment');

  if (!order) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Order not found');
  }

  // Auto-sync payment status from Stripe if it is still pending
  if (order.paymentStatus === 'pending' && order.payment) {
    const payment = order.payment as unknown as { stripePaymentIntentId?: string };
    if (payment.stripePaymentIntentId) {
      await processPaymentIntentSuccess(payment.stripePaymentIntentId);
      // Reload order with updated statuses
      const updatedOrder = await Order.findOne({ orderNumber, user: userId })
        .populate('items')
        .populate('payment');
      if (updatedOrder) return updatedOrder;
    }
  }

  return order;
};

export const listUserOrders = async (userId: string) => {
  const orders = await Order.find({ user: userId })
    .populate('payment')
    .sort({ createdAt: -1 });

  const pendingOrders = orders.filter((o) => o.paymentStatus === 'pending' && o.payment);
  if (pendingOrders.length > 0) {
    await Promise.all(
      pendingOrders.map(async (o) => {
        const payment = o.payment as unknown as { stripePaymentIntentId?: string };
        if (payment.stripePaymentIntentId) {
          await processPaymentIntentSuccess(payment.stripePaymentIntentId);
        }
      })
    );
    // Reload to reflect changes
    return Order.find({ user: userId })
      .populate('payment')
      .sort({ createdAt: -1 });
  }

  return orders;
};

export const listAllOrders = async (params: { status?: string; page: number; limit: number }) => {
  const filter: Record<string, unknown> = {};
  if (params.status) {
    filter.orderStatus = params.status;
  }
  const total = await Order.countDocuments(filter);
  const totalPages = Math.ceil(total / params.limit);
  const items = await Order.find(filter)
    .populate('user', 'name email')
    .populate('payment')
    .sort({ createdAt: -1 })
    .skip((params.page - 1) * params.limit)
    .limit(params.limit);

  // Sync any pending payments in parallel
  const pendingOrders = items.filter((o) => o.paymentStatus === 'pending' && o.payment);
  if (pendingOrders.length > 0) {
    await Promise.all(
      pendingOrders.map(async (o) => {
        const payment = o.payment as unknown as { stripePaymentIntentId?: string };
        if (payment.stripePaymentIntentId) {
          await processPaymentIntentSuccess(payment.stripePaymentIntentId);
        }
      })
    );
    // Reload items to reflect changes
    const reloadedItems = await Order.find(filter)
      .populate('user', 'name email')
      .populate('payment')
      .sort({ createdAt: -1 })
      .skip((params.page - 1) * params.limit)
      .limit(params.limit);

    return {
      items: reloadedItems,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
      },
    };
  }

  return {
    items,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
    },
  };
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Order not found');
  }
  order.orderStatus = status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  
  // Transition payment to paid if order is approved for processing, shipping, or delivery
  if (['processing', 'shipped', 'delivered'].includes(status)) {
    order.paymentStatus = 'paid';
  }
  
  if (status === 'delivered') {
    order.deliveredAt = new Date();
  }
  
  await order.save();

  // Create real-time notification
  await createNotification({
    user: String(order.user),
    type: 'order',
    title: 'Order Status Update',
    message: `Your order ${order.orderNumber} status changed to: ${status}.`,
    link: `/dashboard/orders/${order.orderNumber}`,
  });

  return order;
};

export const cancelOrder = async (orderId: string, userId: string) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Order not found');
  }
  if (order.orderStatus !== 'pending') {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      'Only pending orders can be cancelled. Please contact support.'
    );
  }
  order.orderStatus = 'cancelled';
  await order.save();

  // Create cancellation notification
  await createNotification({
    user: String(order.user),
    type: 'order',
    title: 'Order Cancelled',
    message: `Your order ${order.orderNumber} has been successfully cancelled.`,
    link: `/dashboard/orders/${order.orderNumber}`,
  });

  return order;
};

