import { Order } from '@/modules/order/order.model';
import { Product } from '@/modules/product/product.model';
import { User } from '@/modules/user/user.model';
import { OrderItem } from '@/modules/order/orderItem.model';

export const getAdminDashboardStats = async () => {
  // 1. Core KPIs
  const totalRevenueAgg = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  const totalRevenue = totalRevenueAgg[0]?.total ?? 0;

  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalCustomers = await User.countDocuments({ role: 'customer' });

  // 2. Recent Orders (limit 5)
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5);

  // 3. Revenue & Order Trends (Last 7 Days)
  const startOfPeriod = new Date();
  startOfPeriod.setDate(startOfPeriod.getDate() - 6);
  startOfPeriod.setHours(0, 0, 0, 0);

  const salesAgg = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfPeriod },
        orderStatus: { $ne: 'cancelled' },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dateMap = new Map(salesAgg.map((s) => [s._id, s]));
  const revenueOverTime = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfPeriod);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const match = dateMap.get(dateStr);

    revenueOverTime.push({
      date: dateStr,
      revenue: match ? Math.round(match.revenue * 100) / 100 : 0,
      orders: match ? match.orders : 0,
    });
  }

  // 4. Sales Distribution by Category
  const categorySales = await OrderItem.aggregate([
    {
      $lookup: {
        from: 'orders',
        localField: 'order',
        foreignField: '_id',
        as: 'orderDoc',
      },
    },
    { $unwind: '$orderDoc' },
    {
      $match: {
        'orderDoc.orderStatus': { $ne: 'cancelled' },
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDoc',
      },
    },
    { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'categories',
        localField: 'productDoc.category',
        foreignField: '_id',
        as: 'categoryDoc',
      },
    },
    { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$categoryDoc.name', 'Uncategorized'] },
        value: { $sum: '$quantity' },
      },
    },
    {
      $project: {
        _id: 0,
        name: '$_id',
        value: '$value',
      },
    },
  ]);

  return {
    kpis: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      totalProducts,
      totalCustomers,
    },
    recentOrders,
    revenueOverTime,
    salesByCategory: categorySales.length > 0 ? categorySales : [{ name: 'None', value: 0 }],
  };
};
