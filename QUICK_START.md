# Quick Start Guide ⚡

Get up and running in 3 commands!

## Prerequisites

- Node.js installed
- PostgreSQL running (or use Docker)

## Option 1: With Docker (Easiest)

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Sync database and start app
npm run dev
```

That's it! 🎉

## Option 2: Without Docker

```bash
# 1. Update .env with your PostgreSQL credentials
# DATABASE_URL="postgresql://your_user:your_password@localhost:5432/auth_course?schema=public"

# 2. Sync database and start app
npm run dev
```

## What `npm run dev` does:

1. Generates Prisma Client
2. Pushes schema to database (creates tables automatically)
3. Starts the development server with hot reload

## Access the Application

- **API**: http://localhost:3333/api
- **Swagger Docs**: http://localhost:3333/api/docs

## Seed Admin User (Optional)

```bash
npm run prisma:seed
```

**Login Credentials:**
- Email: `admin@example.com`
- Password: `Admin@123`

## Common Commands

```bash
npm run dev              # Start with auto sync
npm run prisma:studio    # Open database GUI
npm run format           # Format code
npm run build            # Build for production
```

## Troubleshooting

### Port 3333 already in use
Change `PORT` in `.env` file

### Database connection error
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`

### Schema out of sync
```bash
npm run db:sync
```

---

For detailed setup, see [SETUP.md](./SETUP.md)
