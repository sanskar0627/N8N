<p align="center">
  <img src="public/logo/logo.png" alt="M9M" width="120">
</p>

<h1 align="center">M9M</h1>

<p align="center">
  The platform for AI workflow automation. Design flows on a visual canvas, connect models and tools, keep credentials in a vault, and inspect every durable run.
</p>

<p align="center">
  <a href="https://github.com/sanskar0627/N8N"><img src="https://img.shields.io/github/stars/sanskar0627/N8N?style=flat-square" alt="GitHub stars"></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT">
</p>

<p align="center">
  <a href="#key-capabilities">Capabilities</a> ·
  <a href="#integrations">Integrations</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#license">License</a>
</p>

## Key capabilities

- **Visual workflow builder** — Drag nodes onto a React Flow canvas, connect them, and run. Triggers and actions live on the same graph.
- **Model flexibility** — Gemini, Anthropic Claude, and OpenAI-compatible models via OpenRouter. Switch providers without rewriting the flow.
- **Durable execution** — Runs are queued on [Inngest](https://www.inngest.com/) with steps, retries, and a persisted execution history.
- **Credentials vault** — API keys and Discord/Slack webhook URLs are encrypted at rest and selected per node. They are not pasted into node parameters.
- **Observe every run** — Live node status in the editor, then a redacted output record under Executions.
- **Safe HTTP by default** — The HTTP Request node blocks private networks, metadata hosts, hop-by-hop headers, and oversized responses.
- **Accounts and billing** — Email/password, Google, and GitHub via Better Auth. Free plan is limited to 3 workflows; Pro is billed through Polar.

## Integrations

| Category | Nodes |
| --- | --- |
| Triggers | Manual, Google Forms, Stripe |
| AI | Gemini, Anthropic, OpenAI (OpenRouter) |
| Tools | HTTP Request |
| Messaging | Discord, Slack |

New node types register in `prisma/schema.prisma`, `src/features/executions/lib/executor-registry.ts`, and `src/config/node-components.ts`.

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

Sign up, create a workflow, add a trigger, and execute it.

`npm run dev:all` starts Next.js and the Inngest dev server together via mprocs. You can also run them separately:

```bash
npm run dev
npm run inngest:dev
```

## Configuration

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/m9m"
BETTER_AUTH_SECRET="generate-a-long-random-string"
BETTER_AUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="generate-another-long-random-string"

# OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Billing (Polar)
POLAR_ACCESS_TOKEN=
POLAR_SUCCESS_URL="http://localhost:3000/workflows"

# Inngest (local)
INNGEST_DEV=1

# Monitoring (optional)
SENTRY_AUTH_TOKEN=
```

`ENCRYPTION_KEY` protects credentials at rest (minimum 16 characters). Changing it invalidates existing keys.

AI provider keys (OpenRouter, Anthropic, Gemini) and Discord/Slack webhook URLs are stored in the in-app credentials vault, not in `.env`.

## How a run works

1. A trigger (manual, Google Form, or Stripe) starts an Inngest event.
2. Nodes execute in topological order.
3. Each node writes into a shared Handlebars context (`{{myRequest.httpResponse}}`, form fields, and so on).
4. The final context is redacted and stored on the `Execution` record.

You can also test a single action node from the editor without running the full graph.

## Project structure

```
prisma/                 Schema and migrations
public/                 Brand and integration logos
src/app/                App Router pages, auth, Inngest, tRPC, webhooks
src/components/         Shared UI, sidebar, React Flow primitives
src/features/
  auth/                 Login and signup
  credentials/          Encrypted credential vault
  editor/               Canvas, header, execute / test
  executions/           Node executors, HTTP guard, run history
  triggers/             Manual, Google Forms, Stripe
  subscriptions/        Polar billing
  workflows/            Workflow CRUD
src/inngest/            Durable functions and realtime channels
src/lib/                Auth, database, Polar, encryption
src/trpc/               App router and React Query client
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js (Turbopack) |
| `npm run inngest:dev` | Local Inngest + realtime |
| `npm run dev:all` | App + Inngest via mprocs |
| `npm run build` / `npm start` | Production |
| `npm run lint` / `npm run format` | Biome |
| `npm test` | Node test runner |

## Contributing

Bug reports and pull requests are welcome on [GitHub](https://github.com/sanskar0627/N8N).

1. Fork the repo and create a branch.
2. Keep the change scoped to one node, route, or feature.
3. Run `npm run lint` and `npm test` before opening the PR.

## License

MIT
