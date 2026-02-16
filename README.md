# Auth Course API 🚀

A production-ready NestJS authentication system with PostgreSQL, Prisma ORM, JWT authentication, and Swagger documentation.

## Features ✨

- **Authentication System**
  - User registration and login
  - JWT access and refresh tokens
  - Password hashing with bcrypt
  - Role-based access control (RBAC)
  - Protected routes with guards

- **Technical Stack**
  - NestJS framework
  - PostgreSQL database
  - Prisma ORM
  - Swagger/OpenAPI documentation
  - TypeScript
  - Class validators and transformers

- **Production Ready**
  - Environment configuration
  - Custom logger service
  - Global exception filters
  - Response transformation interceptors
  - Database connection management
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

## Project Structure 📁

```
src/
├── auth/                       # Authentication module
│   ├── dto/                    # Data transfer objects
│   ├── guards/                 # JWT and role guards
│   ├── strategies/             # Passport strategies
│   ├── auth.controller.ts      # Auth endpoints
│   ├── auth.service.ts         # Auth business logic
│   └── auth.module.ts
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
├── schema.prisma               # Prisma schema
└── seed.ts                     # Database seeding
```

## API Endpoints 🔌

### Public Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api` - Health check

### Protected Endpoints (Requires JWT)

- `GET /api/auth/profile` - Get user profile

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

## Authentication Flow 🔐

1. **Register**: User creates an account with email, password, name, and optional phone
2. **Login**: User logs in with email and password
3. **Receive Tokens**: Access token (7 days) and refresh token (30 days)
4. **Access Protected Routes**: Include access token in Authorization header
5. **Refresh Tokens**: Use refresh token to get new access token when expired

### Example API Usage

#### Register
```bash
curl -X POST http://localhost:3333/api/auth/register \
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
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

#### Get Profile (Protected)
```bash
curl -X GET http://localhost:3333/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema 📊

### Users Table

| Column    | Type      | Description              |
|-----------|-----------|--------------------------|
| id        | UUID      | Primary key              |
| email     | String    | Unique email             |
| password  | String    | Hashed password          |
| name      | String    | User full name           |
| phone     | String?   | Optional phone number    |
| role      | Enum      | User role (ADMIN)        |
| isActive  | Boolean   | Account status           |
| createdAt | DateTime  | Creation timestamp       |
| updatedAt | DateTime  | Last update timestamp    |

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
