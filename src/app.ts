import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env, isDevelopment } from '@/config/env';
import { HttpStatus } from '@/shared/httpStatus';
import { sendResponse } from '@/shared/sendResponse';
import { apiV1Router } from '@/routes/index';
import { notFound } from '@/middlewares/notFound';
import { globalErrorHandler } from '@/middlewares/globalErrorHandler';

const app: Application = express();

// Trust the first proxy (Vercel/most hosts) so client IPs and secure cookies work.
app.set('trust proxy', 1);

// ── Security & platform middleware ────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGINS,
    credentials: true,
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(
  express.json({
    limit: '10mb',
    verify: (req: Request & { rawBody?: Buffer }, _res: Response, buf: Buffer) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

if (isDevelopment) {
  app.use(morgan('dev'));
}

// Baseline rate limiter for the whole API; stricter limiters are added
// per-route on sensitive endpoints (auth, checkout) in later steps.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.', data: null },
  }),
);

// ── Routes ────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    message: 'Welcome to the Cartora API',
    data: { name: 'cartora-server', docs: '/api-docs', health: '/api/v1/health' },
  });
});

app.use('/api/v1', apiV1Router);

// ── Fallbacks ─────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

export default app;
