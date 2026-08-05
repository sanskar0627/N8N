# M9M

A full-stack web app built with Next.js, tRPC, Prisma, Better Auth, Inngest, and Sentry.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **API Layer:** tRPC v11 with TanStack React Query v5
- **Database:** PostgreSQL (Neon) with Prisma 7
- **Auth:** Better Auth (email/password, Google, GitHub)
- **Background Jobs:** Inngest v4 (step functions, AI wrapping)
- **AI Providers:** Google Gemini, Anthropic Claude, OpenRouter
- **Monitoring:** Sentry (error tracking, AI telemetry, console logging)
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

# run dev server + inngest dev server together
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000). Inngest dashboard at [http://localhost:8288](http://localhost:8288).

## Project Structure

```
src/
├── app/
│   ├── (auth)/                     # Auth pages (login, signup)
│   ├── (dashboard)/
│   │   ├── (editor)/               # Workflow editor (coming soon)
│   │   └── (rest)/
│   │       ├── workflows/page.tsx  # Workflows list page
│   │       └── credentials/page.tsx # Credentials page
│   ├── api/
│   │   ├── auth/[...all]/          # Better Auth route handler
│   │   ├── inngest/                # Inngest serve endpoint
│   │   ├── sentry-example-api/     # Sentry test route
│   │   └── trpc/[trpc]/            # tRPC API route handler
│   └── sentry-example-page/        # Sentry test page
├── components/ui/                   # shadcn/ui components
├── features/auth/                   # Auth forms (login, register)
├── inngest/
│   ├── client.ts                    # Inngest client instance
│   └── functions.ts                 # AI execution function (Gemini, OpenRouter, Anthropic)
├── lib/
│   ├── db.ts                        # Prisma client singleton
│   ├── auth.ts                      # Better Auth server config
│   ├── auth-client.ts               # Better Auth client
│   └── utils.ts                     # Utility functions
└── trpc/
    ├── init.ts                      # tRPC initialization
    ├── client.tsx                    # Client-side tRPC provider
    ├── server.tsx                    # Server-side tRPC proxy
    ├── query-client.ts              # TanStack Query client factory
    └── routers/_app.ts              # tRPC router definitions

# Root config files
sentry.server.config.ts              # Sentry server init (AI telemetry + console logging)
sentry.edge.config.ts                # Sentry edge init (console logging)
sentry.client.config.ts              # Sentry client init
next.config.ts                       # Next.js config (Sentry plugin, redirects)
instrumentation.ts                   # Server instrumentation
instrumentation-client.ts            # Client instrumentation
```

## Environment Variables

Create a `.env` file:

```
DATABASE_URL=your_neon_postgresql_connection_string
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3000
INNGEST_DEV=1
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```
