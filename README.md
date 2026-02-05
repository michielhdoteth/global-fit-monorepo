# Global Fit Monorepo

Global Fit monorepo for the AI receptionist dashboard with shared packages for UI, types, utilities, AI agents, and database access.

## Apps

- `apps/receptionist-dashboard`: AI receptionist dashboard (Next.js 16)

## Packages

- `packages/database`: Prisma schema and client
- `packages/types`: Shared model types
- `packages/utils`: API, validation, WhatsApp utilities
- `packages/ui`: Shared UI components
- `packages/ai-agents`: AI orchestration helpers

## Requirements

- Bun
- PostgreSQL

## Setup

1. Copy env file

```bash
cp .env.example .env
```

2. Install dependencies

```bash
bun install
```

3. Generate Prisma client

```bash
bun run db:generate
```

4. Push schema (local/dev)

```bash
bun run db:push
```

## Development

```bash
bun run dev
```

Dashboard runs on http://localhost:3000

## API Notes

The receptionist dashboard exposes API routes under `apps/receptionist-dashboard/app/api` for:

- Auth + NextAuth
- CRM and scheduling
- Campaigns and reminders
- AI assistant and knowledge base
- WhatsApp webhook/send
- Vercel cron handlers

All backend logic is hosted in Next.js API routes for Vercel deployment (no separate VPS).

## Database

Prisma schema lives in `packages/database/schema.prisma`.

Useful commands:

```bash
bun run db:generate
bun run db:push
bun run db:migrate
bun run db:studio
```
