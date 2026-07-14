# Cartora — Server

Backend API for **Cartora**, a production-grade SaaS e-commerce platform.
_Discover. Compare. Shop Smarter._

> This is a scaffold stub. The full README (architecture diagram, env table,
> deployment guide, demo credentials, etc.) is completed in the final build step.

## Tech Stack

Node.js · Express · TypeScript (strict) · MongoDB Atlas + Mongoose · JWT (access + refresh) · Zod · Stripe · ImgBB · Swagger

## Getting Started

```bash
npm install
cp .env.example .env   # fill in values as each feature requires them
npm run dev            # starts on http://localhost:5000
```

Health check: `GET http://localhost:5000/api/v1/health`

## Scripts

| Script               | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start dev server (tsx watch)         |
| `npm run build`      | Compile TypeScript to `dist/`        |
| `npm start`          | Run compiled server                  |
| `npm run type-check` | Type-check without emitting          |
| `npm run lint`       | Lint (zero warnings allowed)         |
| `npm run format`     | Format with Prettier                 |

## Project Structure

```
src/
├─ config/       Typed, zod-validated env loader
├─ modules/      Feature modules (auth, product, order, …)
├─ middlewares/  validateRequest, auth/role guards, error handler, notFound
├─ routes/       /api/v1 router aggregator
├─ shared/       ApiError, sendResponse, catchAsync, httpStatus
├─ types/        Shared types + Express Request augmentation
├─ app.ts        Express app + middleware wiring
└─ server.ts     Bootstrap (DB connect + listen)
```

## API Conventions

- Versioned under `/api/v1`
- Consistent envelope: `{ success, message, data }` (+ optional `meta`)
- Centralized error handling; Zod validation on every input
- Role-based authorization (customer / admin)

## License

MIT
