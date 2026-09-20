import { env } from '@/config/env';
import { Product, type IProduct } from '@/modules/product/product.model';
import { Review } from '@/modules/review/review.model';
import { Category } from '@/modules/category/category.model';
import { ApiError } from '@/shared/ApiError';
import { HttpStatus } from '@/shared/httpStatus';
import type {
  AiChatInput,
  GenerateProductInput,
  CompareProductsInput,
  CartOptimizerInput,
} from '@/modules/ai/ai.validation';
import mongoose, { type QueryFilter } from 'mongoose';

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  role?: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiCandidate {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
}

interface GeminiApiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

// Prioritized list of active Google Gemini models with high free-tier quotas and low latency
const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

/**
 * Executes a resilient HTTP request to Google Gemini API with multi-model fallback and retries.
 */
async function callGemini(
  contents: GeminiContent[],
  systemInstruction?: string,
  options?: {
    temperature?: number;
    jsonResponse?: boolean;
    maxRetries?: number;
  },
): Promise<string> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiError(HttpStatus.SERVICE_UNAVAILABLE, 'GEMINI_API_KEY is not configured on the server');
  }

  const body: {
    contents: GeminiContent[];
    systemInstruction?: { parts: GeminiPart[] };
    generationConfig?: {
      temperature?: number;
      responseMimeType?: string;
    };
  } = {
    contents,
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      ...(options?.jsonResponse ? { responseMimeType: 'application/json' } : {}),
    },
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  let lastError: Error | null = null;

  // Try each model in sequence
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as GeminiApiResponse;

      if (!res.ok || data.error) {
        const errorMsg = data.error?.message || `Gemini API error on ${model} (Status ${res.status})`;
        // Quota exceeded (429), high demand (503), or unavailable (404) -> try next candidate model
        lastError = new Error(errorMsg);
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastError = new Error(`Empty response from ${model}`);
        continue;
      }

      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
  }

  throw new ApiError(
    HttpStatus.SERVICE_UNAVAILABLE,
    lastError?.message || 'Failed to communicate with Gemini AI after attempting all available models',
  );
}

/**
 * Feature 1: Storefront AI Shopping Concierge & Advisor
 */
export async function chatWithConcierge(input: AiChatInput) {
  const { message, history, currentPath } = input;

  // 1. Fetch relevant active products to ground the AI with real store data
  const keywords = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // Search by text or retrieve featured/popular catalog
  const queryFilter: QueryFilter<IProduct> = { isActive: true };
  if (keywords.length > 0) {
    queryFilter.$or = [
      { name: { $regex: keywords.join('|'), $options: 'i' } },
      { tags: { $in: keywords } },
      { isFeatured: true },
      { isBestSeller: true },
    ];
  }

  const [products, categories] = await Promise.all([
    Product.find(queryFilter)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .limit(20)
      .lean(),
    Category.find({ isActive: true }).select('name slug description').lean(),
  ]);

  // Catalog snapshot for context
  const catalogContext = products.map((p) => ({
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    price: `$${p.price.toFixed(2)}`,
    compareAtPrice: p.compareAtPrice ? `$${p.compareAtPrice.toFixed(2)}` : null,
    stock: p.stock,
    category: (p.category as { name?: string })?.name || 'General',
    rating: `${p.rating?.average?.toFixed(1) || 4.5} (${p.rating?.count || 0} reviews)`,
    tags: p.tags?.join(', ') || '',
    description: p.description.slice(0, 150) + '...',
  }));

  const systemInstruction = `You are "Cartora AI", the intelligent personal shopping concierge for Cartora (a premium modern SaaS e-commerce store with tagline "Discover. Compare. Shop Smarter.").

Your goal:
1. Warmly, concisely, and helpfully assist customers with product recommendations, gift advice, outfit styling, sizing, and comparing store products.
2. Ground all product recommendations EXCLUSIVELY in Cartora's real catalog provided below. Do NOT invent fake products.
3. When recommending a product, mention its exact name and slug in markdown format: [Product Name](/products/slug).
4. Keep answers friendly, stylish, concise (2-4 short paragraphs max), and actionable.
5. If the customer asks for a discount or coupon code, remind them they can use standard demo promos like "SAVE10" or "WELCOME20" at checkout.
6. Available Store Categories: ${categories.map((c) => c.name).join(', ')}.

CURRENT CATALOG SNAPSHOT (Live MongoDB Data):
${JSON.stringify(catalogContext, null, 2)}

User Current Page Path: ${currentPath || '/'}`;

  // Build conversation history for Gemini
  const contents: GeminiContent[] = [];

  for (const h of history.slice(-8)) {
    contents.push({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    });
  }

  let reply = '';
  try {
    reply = await callGemini(contents, systemInstruction, { temperature: 0.6 });
  } catch {
    // Graceful offline/grounded concierge fallback if AI API is temporarily unreachable
    if (products.length > 0) {
      const p = products[0];
      const categoryName = (p.category as { name?: string })?.name || 'catalog';
      reply = `Hello! Based on our current collection, I recommend checking out **[${p.name}](/products/${p.slug})** in our ${categoryName} section. It is priced at $${p.price.toFixed(2)} with an average rating of ${p.rating?.average?.toFixed(1) || '4.8'}★.\n\nFeel free to explore our curated selection below, or let me know what style, size, or price range you are looking for!`;
    } else {
      reply = `Welcome to Cartora! I'm your AI shopping assistant. We have a wide range of premium electronics, fashion, and lifestyle items in our store. Let me know what you are looking for and I'll find the best options for you!`;
    }
  }

  // Extract mentioned product slugs from reply or keyword matches
  const matchedSlugs = new Set<string>();
  for (const p of products) {
    if (reply.includes(p.slug) || reply.toLowerCase().includes(p.name.toLowerCase())) {
      matchedSlugs.add(p.slug);
    }
  }

  // If no direct mentions in text but catalog matches exist, select top 2-3 relevant products
  let matchedProducts = products.filter((p) => matchedSlugs.has(p.slug)).slice(0, 4);
  if (matchedProducts.length === 0 && products.length > 0) {
    matchedProducts = products.slice(0, 3);
  }

  // Clean matched products for frontend UI cards
  const formattedProducts = matchedProducts.map((p) => ({
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    currency: p.currency || 'USD',
    thumbnail: p.thumbnail,
    stock: p.stock,
    rating: p.rating,
    categoryName: (p.category as { name?: string })?.name || '',
  }));

  // Smart suggestions for next queries
  const suggestedQueries = [
    '🔥 What are your current best sellers?',
    '🎁 Best gift under $50',
    '👕 Sizing & fit guide',
    '💳 Shipping & returns policy',
  ];

  return {
    reply,
    products: formattedProducts,
    suggestedQueries,
  };
}

/**
 * Feature 2: Product & Review Intelligence (Details Page AI Synthesis)
 */
export async function getProductInsights(productIdOrSlug: string) {
  const isObjectId = mongoose.Types.ObjectId.isValid(productIdOrSlug);
  const query = isObjectId
    ? { _id: productIdOrSlug, isActive: true }
    : { slug: productIdOrSlug, isActive: true };

  const product = await Product.findOne(query)
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .lean();

  if (!product) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Product not found');
  }

  // Fetch reviews
  const reviews = await Review.find({ product: product._id })
    .populate('user', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(15)
    .lean();

  const reviewsSummary = reviews.map((r) => ({
    rating: r.rating,
    comment: r.comment,
  }));

  const systemPrompt = `You are an expert e-commerce product intelligence analyst.
Analyze the following product details, specs, and real customer reviews to generate a high-value, balanced synthesis.
Return strictly valid JSON conforming to this TypeScript interface:
{
  "summary": string; // 2-3 sentences explaining the essence and value proposition of the product
  "pros": string[]; // 3-4 distinct strengths or customer-praised features
  "cons": string[]; // 2-3 honest considerations, limitations, or tips for best use
  "idealFor": string[]; // 3-4 target personas or use-case tags (e.g. "Daily Commuters", "Minimalists", "Power Users")
  "buyerMatchScore": number; // Score from 80 to 99 representing customer satisfaction and appeal
  "verdict": string; // Short 1-sentence bottom-line verdict
  "keyTakeaways": string[]; // 2-3 quick bullet takeaways
}`;

  const userPrompt = `Product Details:
Name: ${product.name}
Category: ${(product.category as { name?: string })?.name || 'General'}
Price: $${product.price}
Description: ${product.description}
Specifications: ${JSON.stringify(product.specs || [])}
Current Average Rating: ${product.rating?.average?.toFixed(1) || '4.8'}/5 (${product.rating?.count || 0} reviews)
Real Customer Reviews (${reviews.length} total):
${JSON.stringify(reviewsSummary, null, 2)}
`;

  const contents: GeminiContent[] = [
    {
      role: 'user',
      parts: [{ text: userPrompt }],
    },
  ];

  try {
    const rawJson = await callGemini(contents, systemPrompt, {
      temperature: 0.3,
      jsonResponse: true,
    });

    const parsed = JSON.parse(rawJson) as {
      summary: string;
      pros: string[];
      cons: string[];
      idealFor: string[];
      buyerMatchScore: number;
      verdict: string;
      keyTakeaways: string[];
    };

    return {
      productId: String(product._id),
      productName: product.name,
      ...parsed,
    };
  } catch {
    // Fallback if structured parsing encounters an anomaly
    return {
      productId: String(product._id),
      productName: product.name,
      summary: `${product.name} offers premium build quality and high customer satisfaction in the ${(product.category as { name?: string })?.name || 'lifestyle'} category.`,
      pros: [
        'Durable, high-grade materials and construction',
        'Exceptional value for money and modern aesthetics',
        'Highly rated for daily reliability and performance',
      ],
      cons: [
        'High demand may lead to limited inventory',
        'Verify dimensions/sizing specifications before ordering',
      ],
      idealFor: ['Quality Seekers', 'Modern Everyday Use', 'Gift Giving'],
      buyerMatchScore: 94,
      verdict: `A highly recommended purchase that delivers on its promises with high customer satisfaction.`,
      keyTakeaways: [
        'Top tier customer satisfaction',
        'Backed by Cartora 30-day guarantee',
      ],
    };
  }
}

/**
 * Feature 3: Admin AI Product Copilot & Content Studio
 */
export async function generateProductListing(input: GenerateProductInput) {
  const { prompt, existingData } = input;

  const categories = await Category.find({ isActive: true }).select('name slug').lean();
  const categoryNames = categories.map((c) => c.name);

  const systemPrompt = `You are Cartora's senior e-commerce copywriter and merchandising assistant.
Your task is to take a merchant's rough product prompt/notes and generate a complete, high-converting product listing in valid JSON.

Available Store Categories to pick from: ${JSON.stringify(categoryNames)}

Output strictly valid JSON matching this structure:
{
  "name": string; // Compelling, SEO-optimized title (50-100 characters)
  "description": string; // 2-3 engaging, persuasive paragraphs explaining benefits and craftsmanship
  "suggestedCategoryName": string; // Must match one of the available store categories closely
  "suggestedPrice": number; // Realistic competitive retail price (e.g. 49.99)
  "suggestedCompareAtPrice": number; // Higher anchor price (e.g. 69.99)
  "suggestedSku": string; // Short uppercase SKU code (e.g. "SHIRT-CTN-BLK")
  "tags": string[]; // 5-8 relevant searchable tags
  "specs": Array<{ "key": string, "value": string }>; // 4-6 key specifications (e.g. Material, Origin, Fit, Care, Warranty)
  "highlights": string[]; // 3-4 key bullet point selling features
}`;

  const userPrompt = `Merchant Prompt / Concept:
"${prompt}"

${
  existingData
    ? `Current Form Draft Data:\n${JSON.stringify(existingData, null, 2)}`
    : ''
}`;

  const contents: GeminiContent[] = [
    {
      role: 'user',
      parts: [{ text: userPrompt }],
    },
  ];

  let parsed: {
    name: string;
    description: string;
    suggestedCategoryName: string;
    suggestedPrice: number;
    suggestedCompareAtPrice: number;
    suggestedSku: string;
    tags: string[];
    specs: Array<{ key: string; value: string }>;
    highlights: string[];
  };

  try {
    const rawJson = await callGemini(contents, systemPrompt, {
      temperature: 0.4,
      jsonResponse: true,
    });

    parsed = JSON.parse(rawJson);
  } catch {
    // Graceful smart draft generator fallback
    const titleWords = prompt.split(/\s+/).slice(0, 8).join(' ');
    const fallbackTitle = titleWords.charAt(0).toUpperCase() + titleWords.slice(1);
    const skuPrefix = prompt.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'PROD';
    const randomCode = Math.floor(100 + Math.random() * 900);

    parsed = {
      name: fallbackTitle || 'Premium Handcrafted Collection Item',
      description: `${prompt}. Engineered with premium materials, modern design aesthetics, and meticulous attention to detail. Designed for long-lasting durability, peak performance, and everyday elegance.`,
      suggestedCategoryName: categoryNames[0] || 'Apparel',
      suggestedPrice: 49.99,
      suggestedCompareAtPrice: 69.99,
      suggestedSku: `${skuPrefix}-${randomCode}`,
      tags: ['premium', 'trending', 'cartora', 'exclusive'],
      specs: [
        { key: 'Material', value: 'High-grade sustainable materials' },
        { key: 'Fit / Type', value: 'Modern Regular Fit' },
        { key: 'Warranty', value: '1-Year Limited Warranty' },
        { key: 'Care', value: 'Spot clean or standard machine wash' },
      ],
      highlights: [
        'Crafted from premium, durable high-grade materials',
        'Contemporary design tailored for modern lifestyles',
        'Backed by Cartora 30-day satisfaction guarantee',
      ],
    };
  }

  // Match category to actual MongoDB category ID if possible
  const matchedCategory = categories.find(
    (c) =>
      c.name.toLowerCase() === parsed.suggestedCategoryName?.toLowerCase() ||
      c.name.toLowerCase().includes(parsed.suggestedCategoryName?.toLowerCase() || '') ||
      parsed.suggestedCategoryName?.toLowerCase().includes(c.name.toLowerCase()),
  );

  return {
    ...parsed,
    categoryId: matchedCategory ? String(matchedCategory._id) : undefined,
  };
}

/**
 * Feature 4: AI Smart Product Comparison Engine (/compare)
 * Evaluates 2-4 products side-by-side with dimensional matrix scoring, winner badges, and personas.
 */
export async function compareProductsWithAi(input: CompareProductsInput) {
  const { productIds, userPriority } = input;

  // Build MongoDB query filters for given IDs or slugs
  const objectIds: mongoose.Types.ObjectId[] = [];
  const slugs: string[] = [];

  for (const idOrSlug of productIds) {
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      objectIds.push(new mongoose.Types.ObjectId(idOrSlug));
    } else {
      slugs.push(idOrSlug);
    }
  }

  const query: QueryFilter<IProduct> = {
    isActive: true,
    $or: [{ _id: { $in: objectIds } }, { slug: { $in: slugs } }],
  };

  let products = await Product.find(query)
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .lean();

  if (products.length === 0) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'No matching products found for comparison');
  }

  // If only 1 product provided, automatically find 1-2 competitor products in the same category or bestsellers
  if (products.length === 1) {
    const mainProduct = products[0];
    const categoryId = (mainProduct.category as { _id?: mongoose.Types.ObjectId })?._id;

    const competitors = await Product.find({
      isActive: true,
      _id: { $ne: mainProduct._id },
      ...(categoryId ? { category: categoryId } : {}),
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .sort({ 'rating.average': -1, soldCount: -1 })
      .limit(2)
      .lean();

    if (competitors.length > 0) {
      products = [...products, ...competitors];
    }
  }

  // Fetch recent reviews for grounded context
  const reviewsByProduct = await Promise.all(
    products.map(async (p) => {
      const revs = await Review.find({ product: p._id }).sort({ rating: -1 }).limit(5).lean();
      return {
        productId: String(p._id),
        name: p.name,
        reviews: revs.map((r) => `${r.rating}★: ${r.comment}`),
      };
    }),
  );

  const catalogContext = products.map((p) => {
    const rev = reviewsByProduct.find((r) => r.productId === String(p._id));
    return {
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      category: (p.category as { name?: string })?.name || 'General',
      price: `$${p.price.toFixed(2)}`,
      compareAtPrice: p.compareAtPrice ? `$${p.compareAtPrice.toFixed(2)}` : null,
      stock: p.stock,
      rating: `${p.rating?.average?.toFixed(1) || 4.5} (${p.rating?.count || 0} reviews)`,
      soldCount: p.soldCount,
      specs: p.specs || [],
      tags: p.tags || [],
      description: p.description.slice(0, 200),
      topCustomerFeedback: rev?.reviews || [],
    };
  });

  const systemPrompt = `You are Cartora's Chief Product Intelligence Specialist.
Your job is to generate a comprehensive, objective, and deeply analytical side-by-side comparison for the provided e-commerce products.

Return STRICTLY valid JSON conforming to this TypeScript schema:
{
  "summary": string; // 2-3 sentence executive summary contrasting the items
  "verdict": string; // 1-2 sentence decisive recommendation
  "winnerBadges": Array<{
    "productId": string; // must match an exact product id from input
    "badgeTitle": string; // e.g. "Overall Champion", "Best Value For Money", "Best Premium Build", "Top Performer"
    "reason": string; // 1 concise sentence explaining why
  }>;
  "dimensions": Array<{
    "name": string; // e.g. "Build Quality & Materials", "Value for Money", "Features & Functionality", "Design & Aesthetics", "Customer Satisfaction"
    "description": string;
    "scores": Array<{
      "productId": string;
      "score": number; // Score 1-10
      "note": string; // Brief note explaining the score
    }>;
  }>;
  "productBreakdowns": Array<{
    "productId": string;
    "pros": string[]; // 3 distinct advantages
    "cons": string[]; // 1-2 honest drawbacks/considerations
    "bestFor": string; // e.g. "Budget-conscious everyday shoppers", "Power users seeking top-tier craftsmanship"
    "overallScore": number; // Overall score 75-99
  }>;
  "keyDifferences": string[]; // 3-4 bullet points highlighting the main trade-offs between the choices
}`;

  const userPrompt = `Products to compare (Real Store Catalog Data):
${JSON.stringify(catalogContext, null, 2)}

Shopper Priority / Preference Note:
"${userPriority || 'General balanced comparison across price, quality, and user satisfaction'}"`;

  const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: userPrompt }] }];

  interface ParsedComparison {
    summary: string;
    verdict: string;
    winnerBadges: Array<{ productId: string; badgeTitle: string; reason: string }>;
    dimensions: Array<{
      name: string;
      description: string;
      scores: Array<{ productId: string; score: number; note: string }>;
    }>;
    productBreakdowns: Array<{
      productId: string;
      pros: string[];
      cons: string[];
      bestFor: string;
      overallScore: number;
    }>;
    keyDifferences: string[];
  }

  let parsed: ParsedComparison;

  try {
    const rawJson = await callGemini(contents, systemPrompt, {
      temperature: 0.3,
      jsonResponse: true,
    });
    parsed = JSON.parse(rawJson);
  } catch {
    // Graceful offline fallback comparison logic
    const sortedByPrice = [...products].sort((a, b) => a.price - b.price);
    const sortedByRating = [...products].sort(
      (a, b) => (b.rating?.average || 0) - (a.rating?.average || 0),
    );

    const lowestPrice = sortedByPrice[0];
    const topRated = sortedByRating[0];

    parsed = {
      summary: `Comparing ${products.map((p) => p.name).join(' vs ')}. Each product serves distinct customer needs across price tiers and feature sets.`,
      verdict: `For best value, **${lowestPrice.name}** stands out, while **${topRated.name}** leads in overall build quality and customer satisfaction.`,
      winnerBadges: [
        {
          productId: String(topRated._id),
          badgeTitle: 'Top Rated Pick',
          reason: `Highest customer rating (${topRated.rating?.average?.toFixed(1) || '4.9'}★)`,
        },
        {
          productId: String(lowestPrice._id),
          badgeTitle: 'Best Budget Value',
          reason: `Most accessible price point at $${lowestPrice.price.toFixed(2)}`,
        },
      ],
      dimensions: [
        {
          name: 'Value for Money',
          description: 'Pricing relative to features and materials offered',
          scores: products.map((p) => ({
            productId: String(p._id),
            score: p._id === lowestPrice._id ? 9 : 8,
            note: p._id === lowestPrice._id ? 'Highly competitive price point' : 'Great premium features for the price',
          })),
        },
        {
          name: 'Build Quality & Reliability',
          description: 'Durability, materials, and long-term customer reliability',
          scores: products.map((p) => ({
            productId: String(p._id),
            score: p._id === topRated._id ? 10 : 8,
            note: 'Engineered with Cartora verified high-grade materials',
          })),
        },
        {
          name: 'Customer Satisfaction',
          description: 'Based on verified reviews and repeat purchase rates',
          scores: products.map((p) => ({
            productId: String(p._id),
            score: Math.round((p.rating?.average || 4.5) * 2),
            note: `${p.rating?.count || 0} customer reviews`,
          })),
        },
      ],
      productBreakdowns: products.map((p) => ({
        productId: String(p._id),
        pros: [
          'High quality materials with modern aesthetic',
          'Fast delivery & 30-day return guarantee',
          'Verified positive customer satisfaction',
        ],
        cons: ['Limited stock availability due to high popularity'],
        bestFor:
          p._id === lowestPrice._id
            ? 'Budget-conscious smart shoppers'
            : 'Shoppers looking for premium craftsmanship',
        overallScore: Math.round(85 + Math.random() * 12),
      })),
      keyDifferences: [
        `Price range spans from $${lowestPrice.price.toFixed(2)} to $${sortedByPrice[sortedByPrice.length - 1].price.toFixed(2)}`,
        'Varying specialized specifications and material treatments tailored for different lifestyles',
      ],
    };
  }

  // Format products for frontend consumption
  const formattedProducts = products.map((p) => ({
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    currency: p.currency || 'USD',
    thumbnail: p.thumbnail,
    images: p.images || [],
    stock: p.stock,
    rating: p.rating,
    soldCount: p.soldCount,
    categoryName: (p.category as { name?: string })?.name || 'General',
    specs: p.specs || [],
    tags: p.tags || [],
    description: p.description,
  }));

  return {
    products: formattedProducts,
    ...parsed,
  };
}

/**
 * Feature 5: AI Smart Cart Optimizer & Bundle Advisor
 * Evaluates cart items, computes synergy score, suggests promo tactics and catalog cross-sells.
 */
export async function optimizeCartWithAi(input: CartOptimizerInput) {
  const { items, userNote } = input;

  // Extract cart product IDs to avoid suggesting items already in the cart
  const cartIds = items.map((i) => i.productId);

  // Fetch complementary products from store catalog
  const catalogQuery: QueryFilter<IProduct> = {
    isActive: true,
    stock: { $gt: 0 },
    _id: { $nin: cartIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) },
  };

  const candidateComplements = await Product.find(catalogQuery)
    .populate('category', 'name slug')
    .sort({ isFeatured: -1, 'rating.average': -1, soldCount: -1 })
    .limit(10)
    .lean();

  const totalCartValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const cartContext = {
    totalValue: `$${totalCartValue.toFixed(2)}`,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    items: items.map((i) => ({
      name: i.name,
      price: `$${i.price.toFixed(2)}`,
      quantity: i.quantity,
      category: i.category || 'General',
    })),
  };

  const catalogCandidates = candidateComplements.map((p) => ({
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    price: `$${p.price.toFixed(2)}`,
    category: (p.category as { name?: string })?.name || 'General',
    rating: `${p.rating?.average?.toFixed(1) || 4.8}★`,
    tags: p.tags?.join(', ') || '',
  }));

  const systemPrompt = `You are Cartora's AI Cart Optimizer and Personal Bundle Stylist.
Analyze the customer's current shopping cart and provide an actionable, encouraging optimization report.

Return STRICTLY valid JSON conforming to this TypeScript schema:
{
  "cartScore": number; // Integer score from 75 to 98 evaluating cart cohesion, savings potential, and styling synergy
  "vibeTitle": string; // e.g. "Urban Minimalist Collection", "Tech Enthusiast Kit", "Curated Essentials"
  "vibeSummary": string; // 2 engaging sentences describing what this haul says about the shopper
  "freeShippingStatus": {
    "qualified": boolean; // true if total >= $50
    "amountNeeded": number; // amount needed if under $50, else 0
    "tip": string; // Encouraging tip regarding free shipping ($50 threshold)
  };
  "savingsAdvice": string; // Specific advice, e.g. "You can apply coupon 'SAVE10' at checkout to save 10% on your order"
  "recommendedProductIds": string[]; // Array of 2-3 exact product IDs selected from the catalog candidates that best pair with the cart
  "pairReasoning": string; // 1-2 sentences explaining why these cross-sell recommendations complete the look/setup
}`;

  const userPrompt = `Customer's Current Cart:
${JSON.stringify(cartContext, null, 2)}

Available Store Add-on Candidates:
${JSON.stringify(catalogCandidates, null, 2)}

Shopper Note: "${userNote || 'Optimize my cart for best style and value'}"`;

  const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: userPrompt }] }];

  interface ParsedCartOptimizer {
    cartScore: number;
    vibeTitle: string;
    vibeSummary: string;
    freeShippingStatus: { qualified: boolean; amountNeeded: number; tip: string };
    savingsAdvice: string;
    recommendedProductIds: string[];
    pairReasoning: string;
  }

  let parsed: ParsedCartOptimizer;

  try {
    const rawJson = await callGemini(contents, systemPrompt, {
      temperature: 0.4,
      jsonResponse: true,
    });
    parsed = JSON.parse(rawJson);
  } catch {
    const freeShippingThreshold = 50;
    const qualifies = totalCartValue >= freeShippingThreshold;
    const diff = Math.max(0, freeShippingThreshold - totalCartValue);

    parsed = {
      cartScore: totalCartValue > 50 ? 94 : 88,
      vibeTitle: 'Curated Quality Essentials',
      vibeSummary: `Your selection of ${items.length} unique item(s) represents great taste with versatile lifestyle utility.`,
      freeShippingStatus: {
        qualified: qualifies,
        amountNeeded: Number(diff.toFixed(2)),
        tip: qualifies
          ? '🎉 You have unlocked Free Standard Delivery on this order!'
          : `Add $${diff.toFixed(2)} more to unlock Free Standard Delivery!`,
      },
      savingsAdvice:
        totalCartValue >= 100
          ? 'Pro tip: Use promo code "SAVE10" at checkout for 10% off your entire order.'
          : 'Pro tip: Use promo code "WELCOME20" if this is your first purchase with Cartora.',
      recommendedProductIds: candidateComplements.slice(0, 3).map((p) => String(p._id)),
      pairReasoning:
        'These curated additions complement your selected items for a complete everyday experience.',
    };
  }

  // Fetch full details of recommended items
  const recIds = new Set(parsed.recommendedProductIds || []);
  let recProducts = candidateComplements.filter((p) => recIds.has(String(p._id)));
  if (recProducts.length === 0 && candidateComplements.length > 0) {
    recProducts = candidateComplements.slice(0, 3);
  }

  const formattedRecommendations = recProducts.map((p) => ({
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    currency: p.currency || 'USD',
    thumbnail: p.thumbnail,
    stock: p.stock,
    rating: p.rating,
    categoryName: (p.category as { name?: string })?.name || '',
  }));

  return {
    ...parsed,
    recommendations: formattedRecommendations,
  };
}
