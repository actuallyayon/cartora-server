import Stripe from 'stripe';
import { env } from '@/config/env';
import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import { Order } from '@/modules/order/order.model';
import { OrderItem } from '@/modules/order/orderItem.model';
import { Payment } from '@/modules/payment/payment.model';
import { Product } from '@/modules/product/product.model';
import { Cart } from '@/modules/cart/cart.model';
import { Coupon } from '@/modules/coupon/coupon.model';
import { createNotification } from '@/modules/notification/notification.service';

const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'dummy_stripe_secret_key', {
  apiVersion: '2025-01-27.acacia' as unknown as Stripe.StripeConfig['apiVersion'],
});

export const processPaymentIntentSuccess = async (paymentIntentId: string) => {
  // Retrieve the payment intent from Stripe to confirm success status
  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error(`❌ Error retrieving PaymentIntent ${paymentIntentId}:`, error);
    return;
  }

  if (paymentIntent.status !== 'succeeded') {
    console.log(`ℹ️  PaymentIntent ${paymentIntentId} status is ${paymentIntent.status}, not succeeded.`);
    return;
  }

  // Find corresponding payment record
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!payment) {
    console.warn(`⚠️  Payment record not found for Stripe PaymentIntent: ${paymentIntentId}`);
    return;
  }

  const order = await Order.findById(payment.order).populate('items');
  if (!order) {
    console.warn(`⚠️  Order record not found for payment: ${payment._id}`);
    return;
  }

  // Check if order has already been processed (prevent duplicate execution)
  if (order.paymentStatus === 'paid') {
    console.log(`ℹ️  Order ${order.orderNumber} is already marked as paid.`);
    return;
  }

  // Update payment details
  payment.status = 'paid';
  payment.stripeChargeId = (paymentIntent.latest_charge as string) || undefined;
  await payment.save();

  // Update order status
  order.paymentStatus = 'paid';
  order.orderStatus = 'processing';
  await order.save();

  // Increment coupon used count if a coupon code was applied
  if (order.appliedCoupon) {
    await Coupon.updateOne(
      { code: order.appliedCoupon.code },
      { $inc: { usedCount: 1 } }
    );
    console.log(`🎟️  Coupon ${order.appliedCoupon.code} usage count incremented.`);
  }

  // Decrement product stock levels and increment sold counts
  for (const itemId of order.items) {
    const orderItem = await OrderItem.findById(itemId);
    if (orderItem && orderItem.product) {
      await Product.updateOne(
        { _id: orderItem.product },
        {
          $inc: {
            stock: -orderItem.quantity,
            soldCount: orderItem.quantity,
          },
        }
      );
      console.log(`📉 Decremented stock for product ${orderItem.product} by ${orderItem.quantity}.`);
    }
  }

  // Empty the user's shopping cart
  await Cart.updateOne(
    { user: order.user },
    { $set: { items: [] } }
  );
  console.log(`🛒 Emptied shopping cart for user ${order.user}.`);

  // Create real-time notification
  await createNotification({
    user: String(order.user),
    type: 'order',
    title: 'Payment Successful',
    message: `Payment for order ${order.orderNumber} was received. We are processing your shipment.`,
    link: `/dashboard/orders/${order.orderNumber}`,
  });

  console.log(`✅ Webhook payment processing complete for order ${order.orderNumber}.`);
};

export const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Stripe webhook signature checking is not configured. Please define STRIPE_WEBHOOK_SECRET.'
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Webhook signature verification failed: ${message}`);
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      `Webhook signature verification failed: ${message}`
    );
  }

  console.log(`📦 Received Stripe webhook event: ${event.type}`);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await processPaymentIntentSuccess(paymentIntent.id);
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
    if (payment) {
      payment.status = 'failed';
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await payment.save();

      await Order.updateOne(
        { _id: payment.order },
        { $set: { paymentStatus: 'failed' } }
      );
      console.log(`❌ Order marked as failed due to PaymentIntent failure.`);

      const order = await Order.findById(payment.order);
      if (order) {
        await createNotification({
          user: String(order.user),
          type: 'order',
          title: 'Payment Failed',
          message: `Your payment for order ${order.orderNumber} failed: ${payment.failureReason}.`,
          link: `/dashboard/orders/${order.orderNumber}`,
        });
      }
    }
  }

  return { received: true };
};
