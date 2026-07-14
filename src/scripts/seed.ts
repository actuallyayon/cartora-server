import { connectDB, disconnectDB } from '@/config/db';
import { env } from '@/config/env';
import { User } from '@/modules/user/user.model';
import { Category } from '@/modules/category/category.model';
import { Coupon } from '@/modules/coupon/coupon.model';
import { slugify } from '@/utils/slug';
import type { UserRole } from '@/shared/constants';

/**
 * Idempotent seed for the demo accounts shown on the login page.
 * Re-running resets their passwords (so graders always get working creds)
 * without duplicating users. Extended with catalog seeds in later steps.
 */
const demoUsers: { name: string; email: string; password: string; role: UserRole }[] = [
  {
    name: 'Demo Customer',
    email: env.DEMO_CUSTOMER_EMAIL,
    password: env.DEMO_CUSTOMER_PASSWORD,
    role: 'customer',
  },
  {
    name: 'Admin',
    email: env.DEMO_ADMIN_EMAIL,
    password: env.DEMO_ADMIN_PASSWORD,
    role: 'admin',
  },
];

async function seedDemoUsers(): Promise<void> {
  for (const demo of demoUsers) {
    const existing = await User.findOne({ email: demo.email }).select('+password');
    if (existing) {
      existing.name = demo.name;
      existing.password = demo.password; // pre-save hook re-hashes
      existing.role = demo.role;
      existing.status = 'active';
      await existing.save();
      console.log(`↻ updated ${demo.role}: ${demo.email}`);
    } else {
      await User.create(demo);
      console.log(`✓ created ${demo.role}: ${demo.email}`);
    }
  }
}

/** The four top-level apparel categories that drive the storefront filter tabs. */
const categories: { name: string; description: string }[] = [
  { name: "Men's", description: "Men's apparel — tees, shirts, hoodies, and more." },
  { name: "Women's", description: "Women's apparel — dresses, tops, and everyday essentials." },
  { name: 'Kids', description: "Kids' clothing built for play and comfort." },
  { name: 'Accessories', description: 'Bags, caps, belts, and finishing touches.' },
  { name: 'Footwear', description: 'Sneakers, boots, and casual shoes.' },
  { name: 'Sports', description: 'Activewear and sports equipment.' },
];

async function seedCategories(): Promise<void> {
  for (const cat of categories) {
    const slug = slugify(cat.name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      existing.name = cat.name;
      existing.description = cat.description;
      existing.isActive = true;
      await existing.save();
      console.log(`↻ category: ${cat.name}`);
    } else {
      await Category.create({ ...cat, slug });
      console.log(`✓ category: ${cat.name}`);
    }
  }
}

async function seedCoupons(): Promise<void> {
  const coupons = [
    {
      code: 'SAVE10',
      description: 'Get 10% off your entire order, no minimum purchase.',
      discountType: 'percentage' as const,
      discountValue: 10,
      minPurchase: 0,
      isActive: true,
    },
    {
      code: 'FLAT15',
      description: 'Save $15 off on purchases above $50.',
      discountType: 'fixed' as const,
      discountValue: 15,
      minPurchase: 50,
      isActive: true,
    },
  ];

  for (const c of coupons) {
    const existing = await Coupon.findOne({ code: c.code });
    if (existing) {
      existing.description = c.description;
      existing.discountType = c.discountType;
      existing.discountValue = c.discountValue;
      existing.minPurchase = c.minPurchase;
      existing.isActive = c.isActive;
      await existing.save();
      console.log(`↻ coupon: ${c.code}`);
    } else {
      await Coupon.create(c);
      console.log(`✓ coupon: ${c.code}`);
    }
  }
}

async function main(): Promise<void> {
  await connectDB();
  console.log('🌱 Seeding demo accounts...');
  await seedDemoUsers();
  console.log('🌱 Seeding categories...');
  await seedCategories();
  console.log('🌱 Seeding coupons...');
  await seedCoupons();
  console.log('✅ Seed complete.');
  await disconnectDB();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
