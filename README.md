# 🛒 Cartora — Modern E-Commerce Platform (Server)

The backend API powering **Cartora** — a full-featured e-commerce platform. Built with **Express 5**, **TypeScript**, **MongoDB (Mongoose)**, and **Stripe** for payment processing. Features a modular, RESTful architecture with JWT authentication, Google OAuth, file uploads, and real-time order notifications.

> **🔗 Live API:** [cartora-server.vercel.app](https://cartora-server.vercel.app)
>
> **🔗 Live Frontend:** [cartora-client.vercel.app](https://cartora-client.vercel.app)
>
> **🔗 API Docs:** [cartora-server.vercel.app/api-docs](https://cartora-server.vercel.app/api-docs)

---

## 🚀 Technologies Used

| Layer          | Technology                                                     |
| -------------- | -------------------------------------------------------------- |
| Runtime        | [Node.js](https://nodejs.org/) (≥ 20)                         |
| Framework      | [Express 5](https://expressjs.com/)                            |
| Language       | [TypeScript](https://www.typescriptlang.org/)                  |
| Database       | [MongoDB](https://www.mongodb.com/) + [Mongoose 9](https://mongoosejs.com/) |
| Authentication | [JWT](https://jwt.io/) + [Google OAuth](https://developers.google.com/identity) |
| Payments       | [Stripe](https://stripe.com/) (Payment Intents + Webhooks)    |
| Validation     | [Zod](https://zod.dev/)                                       |
| File Uploads   | [Multer](https://github.com/expressjs/multer)                 |
| API Docs       | [Swagger](https://swagger.io/) (swagger-jsdoc + swagger-ui)   |
| Security       | [Helmet](https://helmetjs.github.io/), CORS, Rate Limiting    |
| Deployment     | [Vercel](https://vercel.com/) (Serverless Functions)           |

---

## ✨ Core Features

### 🔐 Authentication & Authorization
- **JWT-based auth** with HTTP-only cookie tokens (access + refresh)
- **Google OAuth** sign-in integration
- **Role-based access control** — `customer` and `admin` roles
- **Password hashing** with bcryptjs

### 🛍️ E-Commerce APIs
- **Products** — Full CRUD with variants, specs, tags, image uploads, and text search
- **Categories & Brands** — Organize and filter the product catalog
- **Shopping Cart** — Server-side cart management with quantity updates
- **Wishlist** — Save/remove favorite products
- **Orders** — Complete order lifecycle (pending → processing → shipped → delivered)
- **Coupons** — Discount codes with validation and usage tracking
- **Reviews** — Product ratings and customer reviews

### 💳 Payments
- **Stripe Payment Intents** — Secure card payments
- **Webhook handling** — Automatic order status updates on successful payment
- **Admin notifications** — Real-time alerts to admins when orders are paid

### 📊 Admin Features
- **Analytics API** — Revenue over time, order frequencies, sales by category, KPIs
- **Order management** — Update order statuses, view all customer orders
- **Product management** — Add/edit/delete products with image uploads
- **Banner management** — Homepage promotional banners

### 🛡️ Security & Performance
- **Helmet** — HTTP security headers
- **CORS** — Configurable cross-origin policies
- **Rate limiting** — Protect against brute-force attacks
- **Compression** — Gzip response compression
- **Input validation** — Zod schemas on all endpoints

---

## 📦 Dependencies

### Production
| Package               | Purpose                             |
| --------------------- | ----------------------------------- |
| `express` (5.x)       | Web framework                       |
| `mongoose` (9.x)      | MongoDB ODM                         |
| `stripe` (22.x)       | Payment processing                  |
| `jsonwebtoken` (9.x)  | JWT token generation/verification   |
| `bcryptjs` (3.x)      | Password hashing                    |
| `google-auth-library`  | Google OAuth verification           |
| `zod` (4.x)           | Request validation schemas          |
| `multer` (2.x)        | File upload handling                |
| `helmet` (8.x)        | Security headers                    |
| `cors` (2.x)          | Cross-origin resource sharing       |
| `express-rate-limit`   | API rate limiting                   |
| `compression` (1.x)   | Response compression                |
| `cookie-parser` (1.x) | Cookie parsing middleware           |
| `morgan` (1.x)        | HTTP request logging                |
| `dotenv` (17.x)       | Environment variable loading        |
| `swagger-jsdoc`       | API documentation generation        |
| `swagger-ui-express`  | Swagger UI hosting                  |

### Development
| Package              | Purpose                       |
| -------------------- | ----------------------------- |
| `typescript` (6.x)   | Type safety                   |
| `tsx`                 | TypeScript execution (dev)    |
| `tsc-alias`          | Path alias resolution         |
| `eslint`             | Code linting                  |
| `prettier`           | Code formatting               |

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** ≥ 20
- **npm** or **yarn**
- **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Stripe** account for payment processing

### 1. Clone the repository
```bash
git clone https://github.com/actuallyayon/cartora-server.git
cd cartora-server
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the project root:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://your_connection_string

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### 4. Seed the database (optional)
```bash
npm run seed:demo
```

### 5. Run the development server
```bash
npm run dev
```

The API will be available at **http://localhost:5000**.

### 6. Build for production
```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
src/
├── config/                 # App configuration (env vars, DB connection)
├── middleware/              # Auth, error handling, validation, upload
├── modules/                # Feature-based modules
│   ├── address/            # Shipping address CRUD
│   ├── analytics/          # Admin analytics & KPIs
│   ├── auth/               # Login, register, Google OAuth, JWT
│   ├── banner/             # Homepage banners
│   ├── brand/              # Brand management
│   ├── cart/               # Shopping cart
│   ├── category/           # Product categories
│   ├── coupon/             # Discount codes
│   ├── notification/       # User notifications
│   ├── order/              # Order lifecycle
│   ├── payment/            # Stripe payment intents & webhooks
│   ├── product/            # Product CRUD, search, filtering
│   ├── review/             # Product reviews & ratings
│   ├── upload/             # Image upload handling
│   ├── user/               # User profiles & admin user mgmt
│   └── wishlist/           # Wishlist management
├── shared/                 # Shared utilities (base model, helpers)
├── scripts/                # Database seed scripts
└── server.ts               # Application entry point
```

Each module follows a consistent pattern:
```
module/
├── module.controller.ts    # Route handlers
├── module.service.ts       # Business logic
├── module.model.ts         # Mongoose schema & types
├── module.routes.ts        # Express route definitions
└── module.validation.ts    # Zod request schemas
```

---

## 🔗 Links & Resources

| Resource       | URL                                                                 |
| -------------- | ------------------------------------------------------------------- |
| 🌐 Live Site   | [cartora-client.vercel.app](https://cartora-client.vercel.app)      |
| 🖥️ Live API    | [cartora-server.vercel.app](https://cartora-server.vercel.app)      |
| 📖 API Docs    | [cartora-server.vercel.app/api-docs](https://cartora-server.vercel.app/api-docs) |
| 📦 Client Repo | [github.com/actuallyayon/cartora-client](https://github.com/actuallyayon/cartora-client) |
| 📦 Server Repo | [github.com/actuallyayon/cartora-server](https://github.com/actuallyayon/cartora-server) |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
