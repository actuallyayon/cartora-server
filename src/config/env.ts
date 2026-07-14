import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

/**
 * Single source of truth for environment configuration.
 * Every value is validated at boot so the process fails fast on
 * misconfiguration instead of leaking `undefined`/`any` deeper into the app.
 *
 * Secrets that are only needed in later build steps are kept optional for now
 * and will be tightened to `required` as those features land.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  // Required from Step 2 (database layer).
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Optional: override DNS resolvers (comma-separated). Needed on networks whose
  // default resolver refuses SRV lookups required by `mongodb+srv://`. Leave
  // empty in production (Vercel resolves SRV natively).
  DNS_SERVERS: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  // Required from Step 3 (auth). Must be long, random strings.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Demo accounts surfaced on the login page (seeded via `npm run seed`).
  DEMO_CUSTOMER_EMAIL: z.string().email().default('demo@cartora.app'),
  DEMO_CUSTOMER_PASSWORD: z.string().default('demo1234'),
  DEMO_ADMIN_EMAIL: z.string().email().default('admin@cartora.app'),
  DEMO_ADMIN_PASSWORD: z.string().default('admin1234'),

  // Introduced in later steps — optional until the feature that requires them.
  IMGBB_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  console.error(`❌ Invalid environment configuration:\n${details}`);
  throw new Error('Invalid environment configuration. See logs above.');
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
