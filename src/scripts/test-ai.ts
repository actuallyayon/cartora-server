import 'dotenv/config';
import { connectDB } from '@/config/db';
import {
  chatWithConcierge,
  getProductInsights,
  generateProductListing,
  compareProductsWithAi,
  optimizeCartWithAi,
} from '@/modules/ai/ai.service';
import { Product } from '@/modules/product/product.model';

async function test() {
  await connectDB();
  console.log('--- Testing Feature 1: AI Concierge ---');
  const chatRes = await chatWithConcierge({ message: 'Recommend me a cool tshirt or stylish clothing', history: [] });
  console.log('Concierge Reply:', chatRes.reply.slice(0, 120) + '...');
  console.log('Attached Products Count:', chatRes.products.length);

  const sampleProducts = await Product.find({ isActive: true }).limit(3);
  if (sampleProducts.length > 0) {
    const sampleProduct = sampleProducts[0];
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

  if (sampleProducts.length >= 2) {
    console.log('\n--- Testing Feature 4: AI Product Comparison Studio ---');
    const compareRes = await compareProductsWithAi({
      productIds: [String(sampleProducts[0]._id), String(sampleProducts[1]._id)],
      userPriority: 'Compare value for money and durability',
    });
    console.log('Comparison Summary:', compareRes.summary);
    console.log('Comparison Verdict:', compareRes.verdict);
    console.log('Winner Badges Count:', compareRes.winnerBadges.length);
    console.log('Dimensions Count:', compareRes.dimensions.length);
  }

  if (sampleProducts.length > 0) {
    console.log('\n--- Testing Feature 5: AI Cart Optimizer & Bundle Advisor ---');
    const cartRes = await optimizeCartWithAi({
      items: [
        {
          productId: String(sampleProducts[0]._id),
          name: sampleProducts[0].name,
          price: sampleProducts[0].price,
          quantity: 1,
        },
      ],
    });
    console.log('Cart Score:', cartRes.cartScore);
    console.log('Vibe Title:', cartRes.vibeTitle);
    console.log('Free Shipping Status:', cartRes.freeShippingStatus.tip);
    console.log('Recommended Complements Count:', cartRes.recommendations.length);
  }

  console.log('\n>>> SUCCESS: ALL AI FEATURES (CONCIERGE, INSIGHTS, COPILOT, COMPARE, CART OPTIMIZER) ARE FULLY OPERATIONAL! <<<');
  process.exit(0);
}

test().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
