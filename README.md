<p align="center">
  <img src="public/logo/logo.png" alt="M9M Logo" width="120" />
</p>

<h1 align="center">M9M - AI Workflow Automation Platform</h1>

<p align="center">
  Build, automate, and orchestrate AI-powered workflows with a visual editor. Connect multiple AI providers, manage credentials, and run complex multi-step automations from a single dashboard.
</p>

<p align="center">
  <a href="#key-features">Features</a> &nbsp;|&nbsp;
  <a href="#tech-stack">Tech Stack</a> &nbsp;|&nbsp;
  <a href="#getting-started">Getting Started</a> &nbsp;|&nbsp;
  <a href="#project-structure">Project Structure</a> &nbsp;|&nbsp;
  <a href="#license">License</a>
</p>

---

## Key Features

- **Visual Workflow Editor** - Design multi-step AI workflows with a ReactFlow-powered drag-and-drop canvas
- **Custom Node System** - Modular, extensible node architecture with trigger nodes (Manual Trigger) and execution nodes (HTTP Request), with a registry-based component system
- **Multi-Provider AI** - Connect to Google Gemini, Anthropic Claude, and OpenRouter (Nvidia, Meta, and more) without vendor lock-in
- **Credential Management** - Securely store and manage API keys and service credentials
- **Node Selector** - Sheet-based node picker with categorized triggers and execution nodes, smart positioning, and duplicate trigger prevention
- **Premium Gating** - Built-in subscription management via Polar for free/pro tier access control
- **Background Execution** - Reliable workflow runs powered by Inngest step functions
- **Authentication** - Email/password, Google, and GitHub sign-in via Better Auth
- **Error Monitoring** - Full observability with Sentry (error tracking, AI telemetry, console logging)

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, React Compiler) |
| **Language** | TypeScript |
| **API** | tRPC v11 + TanStack React Query v5 |
| **Database** | PostgreSQL (Neon) + Prisma 7 |
| **Auth** | Better Auth (email, Google, GitHub) |
| **Billing** | Polar (subscription management) |
| **Background Jobs** | Inngest v4 (step functions, AI wrapping) |
| **AI Providers** | Google Gemini, Anthropic Claude, OpenRouter |
| **Workflow Canvas** | ReactFlow (@xyflow/react) |
| **Monitoring** | Sentry (errors, AI telemetry) |
| **UI** | Tailwind CSS v4, shadcn/ui, Radix UI |
| **Linting** | Biome |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- API keys for at least one AI provider

### Installation

```bash
# Clone the repository
git clone https://github.com/sanskar0627/N8N.git
cd N8N

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see below)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start dev server + Inngest
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) for the app and [http://localhost:8288](http://localhost:8288) for the Inngest dashboard.

### Environment Variables

```env
# Database
DATABASE_URL=your_neon_postgresql_connection_string

# Auth
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3000

# AI Providers (at least one required)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Background Jobs
INNGEST_DEV=1

# Monitoring
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Billing
POLAR_ACCESS_TOKEN=your_polar_access_token
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/                        # Auth pages (login, signup)
│   ├── (dashboard)/
│   │   ├── (editor)/                  # Workflow editor routes
│   │   │   └── workflows/[workflowId] # Single workflow view
│   │   └── (rest)/                    # List pages
│   │       ├── workflows/             # Workflows list
│   │       └── credentials/           # Credentials list
│   └── api/
│       ├── auth/[...all]/             # Better Auth handler
│       ├── inngest/                   # Inngest endpoint
│       └── trpc/[trpc]/              # tRPC handler
├── components/
│   ├── react-flow/
│   │   ├── base-node.tsx              # Base node layout (header, content, footer)
│   │   ├── base-handle.tsx            # Styled ReactFlow handle
│   │   └── placeholder-node.tsx       # Placeholder node with click action
│   ├── ui/                            # shadcn/ui primitives
│   ├── initial-node.tsx               # Starting node with node selector
│   ├── node-selector.tsx              # Sheet-based node picker (triggers + executions)
│   ├── workflow-node.tsx              # Node wrapper with toolbar (name, delete, settings)
│   ├── entity-components.tsx          # Reusable list page layout
│   └── upgrade-modal.tsx              # Pro upgrade prompt
├── config/
│   ├── node-components.ts             # Node type registry (maps NodeType to React components)
│   └── constants.ts                   # App constants
├── features/
│   ├── auth/
│   │   └── components/                # Login, register, auth layout
│   ├── editor/
│   │   └── components/
│   │       ├── editor.tsx             # Main workflow editor canvas
│   │       ├── editor-header.tsx      # Editor top bar
│   │       └── add-node-button.tsx    # Floating add node button with selector
│   ├── executions/
│   │   └── components/
│   │       ├── base-execution-node.tsx # Reusable execution node wrapper
│   │       └── http-request/
│   │           └── node.tsx           # HTTP Request node (GET/POST/PUT/PATCH/DELETE)
│   ├── triggers/
│   │   └── components/
│   │       ├── base-trigger-node.tsx   # Reusable trigger node wrapper
│   │       └── manual-trigger/
│   │           └── node.tsx           # Manual trigger node
│   ├── subscriptions/
│   │   └── hooks/                     # Subscription/premium hooks
│   └── workflows/
│       ├── components/                # Workflow UI components
│       ├── hooks/                     # Client-side hooks
│       └── server/
│           ├── routers.ts             # tRPC CRUD routes
│           └── prefetch.ts            # SSR data prefetching
├── hooks/
│   └── use-upgrade-modal.tsx          # Premium gating hook
├── inngest/
│   ├── client.ts                      # Inngest client
│   └── functions.ts                   # AI execution functions
├── lib/
│   ├── db.ts                          # Prisma client
│   ├── auth.ts                        # Auth server config
│   └── auth-client.ts                 # Auth client + Polar
└── trpc/
    ├── init.ts                        # tRPC init + middleware
    ├── client.tsx                      # Client provider
    ├── server.tsx                      # SSR prefetch helpers
    └── routers/_app.ts                # Root router
```

## Node System Architecture

The workflow editor uses a registry-based node system built on ReactFlow:

**Node Types** (defined in Prisma schema):
- `INITIAL` - Starting node, entry point of every workflow
- `MANUAL_TRIGGER` - Trigger node activated by clicking "Execute workflow"
- `HTTP_REQUEST` - Execution node for making HTTP requests

**Component Hierarchy**:
- `BaseNode` / `BaseHandle` - Low-level ReactFlow primitives
- `WorkflowNode` - Adds toolbar with name, description, delete, and settings actions
- `BaseTriggerNode` / `BaseExecutionNode` - Category wrappers that compose WorkflowNode + BaseNode + BaseHandle
- `ManualTriggerNode` / `HttpRequestNode` - Concrete node implementations

New node types are added by creating a component under `features/triggers/` or `features/executions/`, then registering it in `config/node-components.ts`.

## Scripts

```bash
npm run dev          # Start Next.js dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run dev:all      # Dev server + Inngest (via mprocs)
npm run lint         # Lint with Biome
npm run format       # Format with Biome
npm run inngest:dev  # Inngest dev server only
```

## License

MIT
