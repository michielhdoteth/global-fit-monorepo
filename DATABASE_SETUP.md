# Database Setup Guide

## Environment Configuration

The database connection string has been configured in `.env.local`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/globalfit"
```

This assumes:
- PostgreSQL running on localhost:5432
- Username: `postgres`
- Password: `postgres`
- Database: `globalfit`

## Setup Options

### Option 1: Docker (Recommended)

If you have Docker running, start PostgreSQL:

```bash
docker run -d --name globalfit-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=globalfit \
  -p 5432:5432 \
  postgres:16-alpine
```

Then push the schema:
```bash
bun run db:push
```

### Option 2: Local PostgreSQL

1. Install PostgreSQL locally
2. Create database: `createdb -U postgres globalfit`
3. Push schema: `bun run db:push`

### Option 3: Cloud Database (Neon)

Update `.env.local` with your Neon connection string:

```
DATABASE_URL="postgresql://user:password@region.neon.tech/database"
```

Then push the schema:
```bash
bun run db:push
```

## Create Admin User

After database is setup, you can manually insert the admin user in psql:

```sql
INSERT INTO "User" (email, "hashedPassword", "fullName", role, "isActive", "teamId", "createdAt", "updatedAt")
VALUES (
  'admin@globalfit.com',
  -- bcrypt hash of "admin123" (change this in production!)
  '$2a$10$YJyuOB8Bov3.u4Xj7Z6.iOlj7VDLqXiXcJQpXiHhGvU8zZzGVTmJu',
  'Admin User',
  'SUPER_ADMIN',
  true,
  NULL,
  NOW(),
  NOW()
);
```

## Login Credentials

```
Email: admin@globalfit.com
Password: admin123
```

Change these credentials in production!

## Verify Setup

```bash
# Check Prisma client is generated
ls node_modules/@prisma/client

# Verify database connection
bun run db:studio  # Opens Prisma Studio GUI
```
