<p align="center">
  <img src="public/logo/logo.png" alt="M9M" width="120">
</p>

<h1 align="center">M9M</h1>

<p align="center">
  AI workflow automation platform. Design flows on a visual canvas, connect models and tools, keep credentials in a vault, and inspect every run.
</p>

<p align="center">
  <a href="https://m9m.sanskarshukla.com"><strong>Live Demo →</strong></a>
</p>

<p align="center">
  <a href="https://m9m.sanskarshukla.com"><img src="https://img.shields.io/badge/live-m9m.sanskarshukla.com-orange?style=flat-square" alt="Live"></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT">
</p>

<p align="center">
  <a href="#key-capabilities">Capabilities</a> ·
  <a href="#integrations">Integrations</a> ·
  <a href="#tech-stack">Stack</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#how-a-run-works">How it works</a> ·
  <a href="#project-structure">Structure</a>
</p>

---

## Key capabilities

- **Visual workflow builder** — Drag nodes onto a React Flow canvas, connect them, and run. Triggers and actions live on the same graph.
- **Model flexibility** — Gemini, Anthropic Claude, and OpenAI-compatible models via OpenRouter. Switch providers without rewriting the flow.
- **Durable execution** — Runs are queued on Inngest with steps, retries, and persisted execution history. Falls back to direct execution when Inngest is unavailable.
- **Credentials vault** — API keys and webhook URLs are encrypted at rest and selected per node. They never appear in node parameters.
- **Live node status** — Real-time execution feedback in the editor via Inngest realtime channels, plus a redacted output record under Executions.
- **Safe HTTP by default** — The HTTP Request node blocks private networks, metadata hosts, hop-by-hop headers, and oversized responses.
- **Auth and billing** — Email/password auth via Better Auth. Free plan limited to 3 workflows; Pro billed through Polar.

## Integrations

| Category | Nodes |
| --- | --- |
| **Triggers** | Manual, Google Forms, Stripe |
| **AI Models** | Gemini, Anthropic Claude, OpenAI (via OpenRouter) |
| **Tools** | HTTP Request |
| **Messaging** | Discord, Slack |

## Tech stack

| Layer | Technology |
| --- | --- |
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL on Neon, Prisma 7 ORM |
| **Canvas** | React Flow (@xyflow/react) |
| **Background jobs** | Inngest v4 with realtime channels |
| **Auth** | Better Auth (email + OAuth) |
| **Billing** | Polar |
| **API** | tRPC v11 with superjson |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Linting** | Biome |

## Quick start

Requires **Node.js 20+** and a **PostgreSQL** database ([Neon](https://neon.tech) works well).

```bash
git clone https://github.com/sanskar0627/N8N.git
cd N8N
npm install
```

Create a `.env` in the project root (see [Configuration](#configuration)), then:

```bash
npx prisma generate
npx prisma db push
npm run dev:all
```

- App: [http://localhost:3000](http://localhost:3000)
- Inngest: [http://localhost:8288](http://localhost:8288)

`npm run dev:all` starts Next.js and the Inngest dev server together via mprocs. You can also run them separately with `npm run dev` and `npm run inngest:dev`.

## Configuration

```env
# Required
DATABASE_URL="postgresql://user:password@host:5432/m9m"
BETTER_AUTH_SECRET="generate-a-long-random-string"
BETTER_AUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="generate-another-long-random-string"

# OAuth (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Billing
POLAR_ACCESS_TOKEN=
POLAR_SUCCESS_URL="http://localhost:3000/workflows"

# Inngest
INNGEST_DEV=1

# Monitoring (optional)
SENTRY_AUTH_TOKEN=
```

AI provider keys and webhook URLs are stored in the in-app credentials vault, not in `.env`.

## How a run works

1. A trigger (manual, Google Form, or Stripe webhook) starts execution.
2. Nodes execute in topological order with a 60s timeout per node.
3. Each node writes into a shared context using Handlebars templates (`{{myRequest.httpResponse.data}}`).
4. The final context is redacted (secrets stripped) and stored on the Execution record.

Individual nodes can also be tested directly from the editor without running the full workflow.

## Project structure

```
prisma/                 Schema and migrations
public/                 Logos and integration icons
src/app/                App Router pages, API routes, webhooks
src/components/         Shared UI, sidebar, React Flow primitives
src/features/
  auth/                 Login and signup
  credentials/          Encrypted credential vault
  editor/               Canvas, header, execute / test
  executions/           Node executors, HTTP safety, run history
  triggers/             Manual, Google Forms, Stripe
  subscriptions/        Polar billing
  workflows/            Workflow CRUD and tRPC routers
src/inngest/            Durable functions and realtime channels
src/lib/                Auth, database, Polar, encryption helpers
src/trpc/               tRPC router and React Query client
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run inngest:dev` | Local Inngest dev server |
| `npm run dev:all` | Both via mprocs |
| `npm run build` / `npm start` | Production build and start |
| `npm run lint` / `npm run format` | Biome linter and formatter |
| `npm test` | Node test runner |

## License

MIT
