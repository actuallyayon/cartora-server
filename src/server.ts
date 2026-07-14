import type { Server } from 'node:http';
import app from '@/app';
import { env } from '@/config/env';
import { connectDB, disconnectDB } from '@/config/db';
import '@/modules/models';

/**
 * Process bootstrap: connect to MongoDB first, then start listening so the API
 * never serves requests without a database. All models are registered via the
 * `@/modules/models` import above (needed for populate/refs to resolve).
 */
let server: Server;

const bootstrap = async (): Promise<void> => {
  try {
    await connectDB();
    server = app.listen(env.PORT, () => {
      console.log(`🚀 Cartora API running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = (signal: string): void => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  const finish = () => {
    void disconnectDB().finally(() => process.exit(0));
  };
  if (server) {
    server.close(finish);
  } else {
    finish();
  }
};

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

void bootstrap();

export default app;
