import rateLimit from 'express-rate-limit';

/**
 * Strict limiter for sensitive auth endpoints (login/register) to slow down
 * brute-force and credential-stuffing attempts.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in a few minutes.',
    data: null,
  },
});
