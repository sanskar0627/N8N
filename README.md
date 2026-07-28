# n8n

A full-stack web app built with Next.js, tRPC, Prisma, and Better Auth.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **API Layer:** tRPC v11 with TanStack React Query v5
- **Database:** PostgreSQL (Neon) with Prisma 7
- **Auth:** Better Auth (email/password, Google, GitHub)
- **UI:** Tailwind CSS v4, shadcn/ui, Radix UI
- **Forms:** React Hook Form + Zod validation
- **Linting:** Biome

## Getting Started

```bash
# install dependencies
npm install

# generate prisma client
npx prisma generate

# push schema to db
npx prisma db push

# run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                  # Next.js pages and layouts
│   ├── api/trpc/         # tRPC API route handler
│   ├── (auth)/           # Auth pages (login, signup)
│   └── page.tsx          # Home page
├── components/ui/        # shadcn/ui components
├── features/auth/        # Auth forms (login, register)
├── lib/
│   ├── db.ts             # Prisma client singleton
│   ├── auth.ts           # Better Auth server config
│   ├── auth-client.ts    # Better Auth client
│   └── utils.ts          # Utility functions
└── trpc/
    ├── init.ts           # tRPC initialization
    ├── client.tsx        # Client-side tRPC provider
    ├── server.tsx        # Server-side tRPC proxy
    ├── query-client.ts   # TanStack Query client factory
    └── routers/_app.ts   # tRPC router definitions
```

## Environment Variables

Create a `.env` file:

```
DATABASE_URL=your_neon_postgresql_connection_string
```
