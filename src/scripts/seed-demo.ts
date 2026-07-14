import { connectDB, disconnectDB } from '@/config/db';
import { Category } from '@/modules/category/category.model';
import { Product } from '@/modules/product/product.model';
import { slugify } from '@/utils/slug';

/**
 * Optional demo catalog — a dozen realistic apparel products with real product
 * photos, so the storefront looks populated for grading/demos.
 *
 *   npm run seed:demo         # insert/update demo products
 *   npm run seed:demo clear   # remove them (all have SKU prefix DEMO-)
 *
 * These are clearly separated from user-created data (SKU prefix + `demo` tag)
 * and can be wiped anytime without touching real products.
 */
const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

interface DemoProduct {
  name: string;
  categorySlug: 'mens' | 'womens' | 'kids' | 'accessories';
  description: string;
  price: number;
  compareAtPrice?: number;
  photo: string;
  stock: number;
  tags: string[];
  isFeatured?: boolean;
}

const demoProducts: DemoProduct[] = [
  {
    name: 'Classic White Tee',
    categorySlug: 'mens',
    description: 'A pre-shrunk 100% cotton crewneck tee with a clean, everyday fit.',
    price: 19.99,
    compareAtPrice: 29.99,
    photo: img('1521572163474-6864f9cf17ab'),
    stock: 60,
    tags: ['tshirt', 'cotton', 'basics'],
    isFeatured: true,
  },
  {
    name: 'Rugged Denim Jacket',
    categorySlug: 'mens',
    description: 'A timeless washed-denim trucker jacket with a comfortable, structured feel.',
    price: 79.99,
    photo: img('1576566588028-4147f3842f27'),
    stock: 25,
    tags: ['jacket', 'denim'],
  },
  {
    name: 'Slim-Fit Chinos',
    categorySlug: 'mens',
    description: 'Versatile stretch chinos that move with you — office to weekend.',
    price: 44.99,
    compareAtPrice: 59.99,
    photo: img('1620799140408-edc6dcb6d633'),
    stock: 40,
    tags: ['pants', 'chinos'],
  },
  {
    name: 'Floral Summer Dress',
    categorySlug: 'womens',
    description: 'A breezy floral midi dress in lightweight, flowing fabric.',
    price: 54.99,
    photo: img('1618354691373-d851c5c3a990'),
    stock: 30,
    tags: ['dress', 'summer'],
    isFeatured: true,
  },
  {
    name: 'Linen Blouse',
    categorySlug: 'womens',
    description: 'A relaxed, breathable linen blouse with a soft drape.',
    price: 39.99,
    compareAtPrice: 49.99,
    photo: img('1503341504253-dff4815485f1'),
    stock: 35,
    tags: ['top', 'linen'],
  },
  {
    name: 'Chunky Knit Sweater',
    categorySlug: 'womens',
    description: 'A cozy oversized knit that layers beautifully in cooler weather.',
    price: 49.99,
    photo: img('1576871337622-98d48d1cf531'),
    stock: 28,
    tags: ['sweater', 'knit'],
  },
  {
    name: 'Kids Graphic Tee',
    categorySlug: 'kids',
    description: 'A soft, durable cotton tee built for play — and easy on laundry day.',
    price: 14.99,
    photo: img('1594633312681-425c7b97ccd1'),
    stock: 50,
    tags: ['kids', 'tshirt'],
  },
  {
    name: 'Kids Zip Hoodie',
    categorySlug: 'kids',
    description: 'A warm fleece-lined zip hoodie with a snug hood and roomy pockets.',
    price: 29.99,
    compareAtPrice: 39.99,
    photo: img('1620012253295-c15cc3e65df4'),
    stock: 32,
    tags: ['kids', 'hoodie'],
    isFeatured: true,
  },
  {
    name: 'Kids Jogger Pants',
    categorySlug: 'kids',
    description: 'Stretchy, comfy joggers with an elastic waist for all-day play.',
    price: 22.99,
    photo: img('1551232864-3f0890e580d9'),
    stock: 45,
    tags: ['kids', 'pants'],
  },
  {
    name: 'Canvas Tote Bag',
    categorySlug: 'accessories',
    description: 'A sturdy everyday tote in heavyweight canvas with reinforced handles.',
    price: 18.99,
    photo: img('1564859228273-274232fdb516'),
    stock: 70,
    tags: ['bag', 'tote'],
    isFeatured: true,
  },
  {
    name: 'Wool Beanie',
    categorySlug: 'accessories',
    description: 'A soft ribbed-knit beanie that keeps its shape and keeps you warm.',
    price: 16.99,
    compareAtPrice: 22.99,
    photo: img('1434389677669-e08b4cac3105'),
    stock: 55,
    tags: ['hat', 'beanie'],
  },
  {
    name: 'Classic Baseball Cap',
    categorySlug: 'accessories',
    description: 'An adjustable six-panel cap in brushed cotton twill.',
    price: 21.99,
    photo: img('1583743814966-8936f5b7be1a'),
    stock: 48,
    tags: ['hat', 'cap'],
  },
];

async function clearDemo(): Promise<void> {
  const res = await Product.deleteMany({ sku: { $regex: '^DEMO-' } });
  console.log(`🧹 removed ${res.deletedCount} demo products`);
}

async function seedDemo(): Promise<void> {
  const categories = await Category.find().select('slug').lean();
  const catBySlug = new Map(categories.map((c) => [c.slug, String(c._id)]));

  let created = 0;
  let updated = 0;
  let index = 0;

  for (const p of demoProducts) {
    index += 1;
    const categoryId = catBySlug.get(p.categorySlug);
    if (!categoryId) {
      console.warn(`⚠️  category "${p.categorySlug}" missing — run "npm run seed" first`);
      continue;
    }

    const sku = `DEMO-${String(index).padStart(3, '0')}`;
    const doc = {
      name: p.name,
      description: p.description,
      category: categoryId,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      thumbnail: p.photo,
      images: [p.photo],
      stock: p.stock,
      tags: [...p.tags, 'demo'],
      isFeatured: p.isFeatured ?? false,
      isActive: true,
    };

    const existing = await Product.findOne({ sku });
    if (existing) {
      Object.assign(existing, doc);
      await existing.save();
      updated += 1;
    } else {
      await Product.create({ ...doc, sku, slug: slugify(p.name) });
      created += 1;
    }
    console.log(`✓ ${p.name} (${p.categorySlug})`);
  }

  console.log(`✅ demo catalog ready — ${created} created, ${updated} updated`);
}

async function main(): Promise<void> {
  const shouldClear = process.argv[2] === 'clear';
  await connectDB();
  if (shouldClear) {
    console.log('🧹 Clearing demo products...');
    await clearDemo();
  } else {
    console.log('🌱 Seeding demo catalog...');
    await seedDemo();
  }
  await disconnectDB();
}

main().catch((err) => {
  console.error('❌ Demo seed failed:', err);
  process.exit(1);
});
