# Setup Guide 🚀

Follow these steps to get your authentication system up and running.

## Step 1: Start PostgreSQL Database

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker-compose up -d

# Check if container is running
docker ps | grep auth-course-postgres
```

### Option B: Using Local PostgreSQL

If you have PostgreSQL installed locally:

1. Create a database named `auth_course`
2. Update the `.env` file with your database credentials

```env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/auth_course?schema=public"
```

## Step 2: Sync Database Schema

### For Development (Quick Sync)

```bash
# Sync schema without creating migrations
npm run db:sync
```

This command will:
- Generate Prisma Client
- Push schema changes to the database (no migration files)

### For Production (With Migrations)

```bash
# Create and run migrations
npm run prisma:migrate

# When prompted for migration name, enter: init
```

## Step 3: Seed the Database (Optional)

This creates a default admin user:

```bash
npm run prisma:seed
```

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `Admin@123`

## Step 4: Start the Application

### Quick Start (with automatic DB sync)

```bash
# Start with automatic database sync
npm run dev
```

### Manual Start

```bash
# Development mode with hot reload
npm run start:dev
```

The application will start on:
- **API**: http://localhost:3333/api
- **Swagger Docs**: http://localhost:3333/api/docs

## Verify Installation

1. Open http://localhost:3333/api/docs in your browser
2. You should see the Swagger API documentation
3. Try the health check endpoint: GET http://localhost:3333/api

## Test Authentication

### Using Swagger UI:

1. Go to http://localhost:3333/api/docs
2. Click on **POST /api/auth/register** to register a new user
3. Click on **POST /api/auth/login** to login
4. Copy the `accessToken` from the response
5. Click the **Authorize** button at the top
6. Paste the token and click **Authorize**
7. Now you can test protected endpoints like **GET /api/auth/profile**

### Using cURL:

```bash
# Register a new user
curl -X POST http://localhost:3333/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "name": "Test User",
    "phone": "+1234567890"
  }'

# Login
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'

# Get profile (replace TOKEN with your access token)
curl -X GET http://localhost:3333/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

## Troubleshooting

### Database Connection Error

If you get a database connection error:

1. Make sure PostgreSQL is running
2. Check your `.env` file has the correct `DATABASE_URL`
3. Try connecting manually: `psql -h localhost -U postgres -d auth_course`

### Port Already in Use

If port 3333 is already in use:

1. Change the `PORT` in `.env` file
2. Restart the application

### Prisma Client Issues

If you encounter Prisma client issues:

```bash
# Regenerate Prisma client
npm run prisma:generate

# Reset database (WARNING: This deletes all data)
npx prisma migrate reset
```

## Next Steps

Your authentication system is now ready! You can:

1. **Explore the API** using Swagger at http://localhost:3333/api/docs
2. **Test authentication flows** with the provided endpoints
3. **Review the code structure** to understand the implementation
4. **Extend the system** by adding more features based on your schema

## Useful Commands

```bash
# Development
npm run dev                    # Start with auto DB sync
npm run start:dev              # Start with hot reload
npm run start:debug            # Start in debug mode

# Database
npm run db:sync                # Sync DB schema (dev mode)
npm run prisma:push            # Push schema changes
npm run prisma:generate        # Generate Prisma Client
npm run prisma:migrate         # Create new migration (production)
npm run prisma:studio          # Open Prisma Studio (DB GUI)
npm run prisma:seed            # Seed database
npx prisma migrate reset       # Reset database

# Code Quality
npm run format                 # Format code

# Production
npm run build                  # Build project
npm run start:prod             # Run production build
```

---

**Need Help?** Check the main README.md for more information.
