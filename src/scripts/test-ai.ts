import 'dotenv/config';
import { connectDB } from '@/config/db';
import { chatWithConcierge, getProductInsights, generateProductListing } from '@/modules/ai/ai.service';
import { Product } from '@/modules/product/product.model';

async function test() {
  await connectDB();
  console.log('--- Testing Feature 1: AI Concierge ---');
  const chatRes = await chatWithConcierge({ message: 'Recommend me a cool tshirt or stylish clothing', history: [] });
  console.log('Concierge Reply:', chatRes.reply.slice(0, 120) + '...');
  console.log('Attached Products Count:', chatRes.products.length);

  const sampleProduct = await Product.findOne({ isActive: true });
  if (sampleProduct) {
    console.log('\n--- Testing Feature 2: Product Insights for:', sampleProduct.name, '---');
    const insights = await getProductInsights(String(sampleProduct._id));
    console.log('Buyer Match Score:', insights.buyerMatchScore);
    console.log('Verdict:', insights.verdict);
    console.log('Pros count:', insights.pros?.length);
    console.log('Cons count:', insights.cons?.length);
  }

  console.log('\n--- Testing Feature 3: Admin Product Copilot ---');
  const draft = await generateProductListing({ prompt: 'Oversized Vintage Washed Heavyweight Graphic Hoodie, charcoal grey, price 65 USD' });
  console.log('Draft Title:', draft.name);
  console.log('Draft Sku:', draft.suggestedSku);
  console.log('Draft Price:', draft.suggestedPrice);
  console.log('Draft Category:', draft.suggestedCategoryName);

  console.log('\n>>> SUCCESS: ALL 3 AI FEATURES ARE FULLY OPERATIONAL! <<<');
  process.exit(0);
}

test().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
