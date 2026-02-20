# Power Genix API 🚀

A comprehensive business management system built with NestJS, PostgreSQL, Prisma ORM, JWT authentication, and interactive Swagger documentation. This API provides complete functionality for managing inventory, production, accounting, suppliers, customers, and more.

## 🎯 Overview

Power Genix API is a full-featured ERP (Enterprise Resource Planning) system designed for manufacturing and distribution businesses. It handles everything from raw material procurement to production, inventory management, and financial accounting.

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access & refresh tokens
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Secure protected routes with guards
- Token expiration & refresh mechanism

### 📦 Inventory Management
- Multi-type inventory (Raw materials & Finished products)
- Real-time stock tracking with weighted average pricing
- Stock adjustment history and audit trail
- Category-based organization
- Low stock alerts and filtering

### 🏭 Production Management
- Recipe-based production system
- Batch production tracking
- Automatic stock adjustments on production completion
- Production history and analytics
- Cost calculation per batch

### 💰 Financial Management
- Multi-account system (Cash, Bank, Credit Card)
- Complete ledger with transaction history
- Account balance tracking
- Expense management by category
- Financial reporting

### 🛒 Purchase Management
- Purchase invoice creation and tracking
- Supplier management
- Payment tracking (Partial & Full)
- Purchase history and analytics
- Supplier statements

### 👥 Customer & Supplier Management
- Complete customer database
- Supplier information management
- Contact details and history
- Relationship tracking

### 📊 Reporting & Analytics
- Inventory reports
- Financial statements
- Production analytics
- Purchase summaries
- Supplier/Customer statements

### 🛠️ Technical Excellence
- NestJS framework with TypeScript
- PostgreSQL database with Prisma ORM
- Interactive Swagger/OpenAPI documentation with dark mode
- Comprehensive input validation
- Global exception handling
- Response transformation
- Custom logger service
- Docker support

## Prerequisites 📋

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn
- Docker (optional)

## Installation 🔧

### 1. Clone the repository

```bash
cd auth-course
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` file with your database credentials and JWT secrets.

### 4. Start PostgreSQL (using Docker)

```bash
docker-compose up -d
```

Or install PostgreSQL locally and create a database named `auth_course`.

### 5. Sync Database Schema

For development (quick setup):
```bash
npm run db:sync
```

Or for production (with migrations):
```bash
npm run prisma:migrate
```

### 6. Seed the database (optional)

```bash
npm run prisma:seed
```

This creates an admin user:
- Email: `admin@example.com`
- Password: `Admin@123`

## Running the Application 🏃

### Development mode (with auto DB sync)

```bash
npm run dev
```

### Development mode (manual)

```bash
npm run start:dev
```

### Production mode

```bash
npm run build
npm run start:prod
```

The API will be available at:
- **API**: http://localhost:3333/api
- **Swagger Docs**: http://localhost:3333/api/docs

## Deploy to Railway

This project is configured for [Railway](https://railway.app). Both the app and PostgreSQL can run on Railway.

### 1. Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in.
2. **New Project** → **Deploy from GitHub repo** (or push this repo and connect it).
3. Add **PostgreSQL** from the same project: **+ New** → **Database** → **PostgreSQL**. Railway will set `DATABASE_URL` automatically.

### 2. Configure the service

- **Build command:** `npm run build` (runs `prisma generate` + `nest build`).
- **Start command:** `prisma migrate deploy && npm run start:prod` (already set in `railway.toml`).
- **Root directory:** leave default (project root).

### 3. Environment variables

In the service **Variables** tab, set (Railway sets `PORT` and `DATABASE_URL` for you):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Set automatically when you add PostgreSQL and link the service. |
| `PORT` | No | Set by Railway. |
| `NODE_ENV` | No | Set to `production` in production. |
| `JWT_SECRET` | Yes | Strong secret for access tokens. |
| `JWT_REFRESH_SECRET` | Yes | Strong secret for refresh tokens. |
| `APP_URL` | No | Your app URL (e.g. `https://your-app.up.railway.app`) for CORS/docs. |

Generate strong secrets for production, e.g.:

```bash
openssl rand -base64 32
```

### 4. Deploy

Push to your connected branch; Railway will build and deploy. Migrations run on each deploy via the start command. After deploy, open the generated URL (e.g. `https://your-service.up.railway.app`). API base: `/api/v1`, Swagger: `/api/docs` or `/docs` (see `SWAGGER_PATH`).

## 📁 Project Structure

```
src/
├── auth/                       # Authentication module
│   ├── dto/                    # Auth DTOs
│   ├── guards/                 # JWT & role guards
│   ├── strategies/             # Passport strategies
│   └── auth.controller.ts
├── account/                    # Financial accounts & ledger
│   ├── dto/
│   └── account.controller.ts
├── customer/                   # Customer management
│   ├── dto/
│   └── customer.controller.ts
├── supplier/                   # Supplier management
│   ├── dto/
│   └── supplier.controller.ts
├── category/                   # Item categories
│   ├── dto/
│   └── category.controller.ts
├── item/                       # Inventory items
│   ├── dto/
│   └── item.controller.ts
├── expense-category/           # Expense categories
│   ├── dto/
│   └── expense-category.controller.ts
├── expense/                    # Expense tracking
│   ├── dto/
│   └── expense.controller.ts
├── recipe/                     # Production recipes
│   ├── dto/
│   └── recipe.controller.ts
├── production/                 # Production management
│   ├── dto/
│   └── production.controller.ts
├── purchase-invoice/           # Purchase invoices
│   ├── dto/
│   └── purchase-invoice.controller.ts
├── payment/                    # Payment tracking
│   ├── dto/
│   └── payment.controller.ts
├── common/                     # Shared modules
│   ├── database/               # Prisma service
│   ├── decorators/             # Custom decorators
│   ├── filters/                # Exception filters
│   ├── interceptors/           # Response interceptors
│   └── logger/                 # Logger service
├── config/                     # Configuration files
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── security.config.ts
│   └── swagger.config.ts
├── app.module.ts               # Root module
└── main.ts                     # Application entry point

prisma/
├── schema.prisma               # Database schema
└── seed.ts                     # Database seeding

docs/
└── API_DOCUMENTATION.md        # Complete API documentation
```

## 🔌 API Endpoints

> **📚 Complete API Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed endpoint documentation with request/response examples.

### Authentication (Public)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token

### Authentication (Protected)
- `GET /api/v1/auth/profile` - Get user profile

### Customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers` - List customers (paginated)
- `GET /api/v1/customers/:id` - Get customer
- `PATCH /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer

### Suppliers
- `POST /api/v1/suppliers` - Create supplier
- `GET /api/v1/suppliers` - List suppliers (paginated)
- `GET /api/v1/suppliers/:id` - Get supplier
- `GET /api/v1/suppliers/:id/statement` - Get supplier statement
- `PATCH /api/v1/suppliers/:id` - Update supplier
- `DELETE /api/v1/suppliers/:id` - Delete supplier

### Categories
- `POST /api/v1/categories` - Create category
- `GET /api/v1/categories` - List categories (paginated)
- `GET /api/v1/categories/:id` - Get category
- `PATCH /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### Items & Inventory
- `POST /api/v1/items` - Create item (quantity=0)
- `GET /api/v1/items` - List items with filters (paginated)
- `GET /api/v1/items/:id` - Get item
- `GET /api/v1/items/:id/stock` - Get stock information
- `GET /api/v1/items/:id/stock-history` - Get stock history
- `POST /api/v1/items/:id/adjust-stock` - Adjust stock (add/remove)
- `PATCH /api/v1/items/:id` - Update item
- `DELETE /api/v1/items/:id` - Delete item (if quantity=0)

### Expense Categories
- `POST /api/v1/expense-categories` - Create expense category
- `GET /api/v1/expense-categories` - List expense categories
- `GET /api/v1/expense-categories/:id` - Get expense category
- `PATCH /api/v1/expense-categories/:id` - Update expense category
- `DELETE /api/v1/expense-categories/:id` - Delete expense category

### Expenses
- `POST /api/v1/expenses` - Create expense
- `POST /api/v1/expenses/bulk-by-day` - Create bulk expenses
- `GET /api/v1/expenses` - List expenses with filters
- `GET /api/v1/expenses/:id` - Get expense
- `PATCH /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense

### Recipes
- `POST /api/v1/recipes` - Create recipe
- `GET /api/v1/recipes` - List recipes
- `GET /api/v1/recipes/:id` - Get recipe with cost calculation
- `PATCH /api/v1/recipes/:id` - Update recipe
- `DELETE /api/v1/recipes/:id` - Delete recipe

### Production
- `POST /api/v1/production` - Create production order
- `GET /api/v1/production` - List production orders with filters
- `GET /api/v1/production/:id` - Get production order
- `POST /api/v1/production/:id/complete` - Complete production (adjust stock)
- `PATCH /api/v1/production/:id` - Update production (if pending)
- `DELETE /api/v1/production/:id` - Delete production (if pending)

### Purchase Invoices
- `POST /api/v1/purchase-invoices` - Create purchase invoice
- `GET /api/v1/purchase-invoices` - List invoices with filters
- `GET /api/v1/purchase-invoices/summary` - Get purchase summary
- `GET /api/v1/purchase-invoices/:id` - Get invoice
- `PATCH /api/v1/purchase-invoices/:id` - Update invoice
- `DELETE /api/v1/purchase-invoices/:id` - Delete invoice

### Payments
- `POST /api/v1/payments` - Create payment
- `GET /api/v1/payments` - List payments with filters
- `GET /api/v1/payments/:id` - Get payment
- `PATCH /api/v1/payments/:id` - Update payment
- `DELETE /api/v1/payments/:id` - Delete payment

### Accounts & Ledger
- `POST /api/v1/accounts` - Create account
- `GET /api/v1/accounts` - List accounts with filters
- `GET /api/v1/accounts/:id` - Get account
- `GET /api/v1/accounts/:id/ledger` - Get account ledger (paginated)
- `GET /api/v1/accounts/:id/balance` - Get account balance
- `PATCH /api/v1/accounts/:id` - Update account
- `DELETE /api/v1/accounts/:id` - Delete account (if no transactions)

### Interactive Documentation
Access the beautiful dark-themed Swagger UI:
```
http://localhost:3333/api/docs
```

## Environment Variables 🔐

```env
# Application
NODE_ENV=development
PORT=3333
APP_NAME="Auth Course API"
APP_URL=http://localhost:3333

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/auth_course?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=30d

# Security
BCRYPT_SALT_ROUNDS=10

# Swagger
SWAGGER_TITLE="Auth Course API"
SWAGGER_DESCRIPTION="Authentication API Documentation"
SWAGGER_VERSION=1.0
SWAGGER_PATH=api/docs
```

## Available Scripts 📜

```bash
# Development
npm run dev                # Start with auto DB sync (recommended)
npm run start:dev          # Start in watch mode
npm run start:debug        # Start in debug mode

# Production
npm run build              # Build the project
npm run start:prod         # Run production build

# Database
npm run db:sync            # Sync schema (dev) - generate + push
npm run prisma:push        # Push schema to DB (no migrations)
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run migrations (production)
npm run prisma:studio      # Open Prisma Studio
npm run prisma:seed        # Seed database

# Code Quality
npm run format             # Format code with Prettier

# Testing
npm run test               # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run e2e tests
```

## 🔐 Authentication Flow

1. **Register**: User creates an account with email, password, name, and optional phone
2. **Login**: User logs in with email and password
3. **Receive Tokens**: Access token (7 days) and refresh token (30 days)
4. **Access Protected Routes**: Include access token in Authorization header
5. **Refresh Tokens**: Use refresh token to get new access token when expired

### Quick Start Examples

#### Register
```bash
curl -X POST http://localhost:3333/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe",
    "phone": "+1234567890"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

#### Get Profile (Protected)
```bash
curl -X GET http://localhost:3333/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Create Customer
```bash
curl -X POST http://localhost:3333/api/v1/customers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Corporation",
    "email": "contact@abc.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, Country"
  }'
```

#### Adjust Stock
```bash
curl -X POST http://localhost:3333/api/v1/items/1/adjust-stock \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 100,
    "price": 50,
    "reason": "Initial stock"
  }'
```

## 📊 Database Schema

The system uses PostgreSQL with Prisma ORM. Key tables include:

### Core Tables

**Users**
- Authentication and user management
- Fields: id, email, password, name, phone, role, isActive

**Accounts**
- Financial accounts (Cash, Bank, Credit Card)
- Fields: id, name, account_type, opening_balance, current_balance

**Categories**
- Item categorization
- Fields: id, name

**Items**
- Inventory items (RAW materials and FINAL products)
- Fields: id, name, category_id, item_type, quantity, avg_price

### Business Operations

**Customers**
- Customer database
- Fields: id, name, email, phone, address

**Suppliers**
- Supplier database
- Fields: id, name, email, phone, address

**ExpenseCategories**
- Expense categorization
- Fields: id, name, description

**Expenses**
- Expense tracking
- Fields: id, expense_category_id, account_id, amount, expense_date, description

### Inventory & Production

**StockAdjustments**
- Stock movement history
- Fields: id, item_id, adjustment_type, quantity, price, reason, adjusted_by

**Recipes**
- Production recipes
- Fields: id, final_item_id, batch_quantity

**RecipeIngredients**
- Recipe ingredient details
- Fields: id, recipe_id, raw_item_id, quantity

**Production**
- Production orders
- Fields: id, recipe_id, batches, status, production_date

**ProductionIngredients**
- Production ingredient usage
- Fields: id, production_id, raw_item_id, quantity_used

### Financial Management

**PurchaseInvoices**
- Purchase invoice tracking
- Fields: id, supplier_id, account_id, invoice_number, total_amount, paid_amount, balance_amount

**PurchaseInvoiceItems**
- Invoice line items
- Fields: id, purchase_invoice_id, item_id, quantity, price

**Payments**
- Payment tracking
- Fields: id, supplier_id, purchase_invoice_id, account_id, amount, payment_method

**LedgerEntries**
- Complete financial ledger
- Fields: id, account_id, entry_type, amount, description, reference_type, reference_id

> **📋 Detailed Schema:** Check `prisma/schema.prisma` for the complete database schema.

## Security Features 🔒

- Password hashing with bcrypt (10 salt rounds)
- JWT access and refresh tokens
- Role-based access control
- Protected routes with guards
- Input validation with class-validator
- SQL injection protection (Prisma ORM)
- CORS enabled

## Best Practices 💎

- Modular architecture
- Dependency injection
- Environment-based configuration
- Global exception handling
- Response transformation
- Comprehensive logging
- Type safety with TypeScript
- API documentation with Swagger

## Docker Support 🐳

Start PostgreSQL with Docker:

```bash
docker-compose up -d
```

Stop PostgreSQL:

```bash
docker-compose down
```

## Contributing 🤝

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License 📄

This project is licensed under the MIT License.

## Support 💬

For issues and questions, please open an issue on the repository.

---

Built with ❤️ using NestJS
