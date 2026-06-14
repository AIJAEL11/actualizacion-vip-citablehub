# CitableHub — AI Visibility Platform

<p align="center">
  <strong>Make your digital products discoverable by AI search engines.</strong>
</p>

## What is CitableHub?

CitableHub is an **AI visibility platform** that helps digital products — SaaS tools, APIs, open-source projects, and digital services — get discovered and recommended by AI-powered search engines like ChatGPT, Perplexity, Claude, Gemini, and others.

As AI search replaces traditional browsing, products need structured, machine-readable profiles to be "citable" by LLMs. CitableHub creates those profiles and optimizes them for AI discovery.

### 🌐 Live at [citablehub.com](https://citablehub.com)

---

## Core Features

| Feature | Description |
|---------|-------------|
| **AI-Optimized Profiles** | Structured project pages with JSON-LD, semantic metadata, and AI-extractable summaries |
| **Citability Score** | Multi-factor score measuring how well AI systems can discover and cite your product |
| **GQI Boost** | Optional one-time purchase to amplify AI visibility across discovery channels |
| **Discovery AI Analyst** | Chat interface that queries the CitableHub index to match user needs with products |
| **MCP Gateway** | Model Context Protocol server exposing CitableHub data to AI agents and tools |
| **GEO Audit** | Generative Engine Optimization analysis for each project |
| **Badge System** | Embeddable SVG badges showing citability scores |
| **Programmatic SEO** | Auto-generated `/best/[category]` and `/compare/[a]-vs-[b]` pages |
| **llms.txt & RSS** | Machine-readable feeds for AI crawlers |
| **IndexNow** | Instant URL indexing on create/edit/claim |

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, Framer Motion, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth.js (Google OAuth + Credentials)
- **Payments:** Stripe Checkout
- **LLM:** Abacus AI API (multi-model broker)
- **Storage:** AWS S3
- **Analytics:** Google Analytics 4

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Yarn package manager

### Installation

```bash
# Clone the repo
git clone https://github.com/AIJAEL11/actualizacion-vip-citablehub.git
cd actualizacion-vip-citablehub

# Install dependencies
yarn install

# Copy environment variables
cp .env.example .env
# Fill in your values in .env

# Generate Prisma client
yarn prisma generate

# Push database schema
yarn prisma db push

# Run development server
yarn dev
```

### Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random secret for auth sessions |
| `ABACUSAI_API_KEY` | ✅ | LLM API key from Abacus AI |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `STRIPE_SECRET_KEY` | Optional | Stripe secret key for payments |
| `AWS_BUCKET_NAME` | Optional | S3 bucket for file uploads |

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   ├── (content)/          # SSR content pages (privacy, terms, etc.)
│   ├── best/[category]/    # Programmatic category pages
│   ├── compare/[a]-vs-[b]/ # Comparison pages
│   ├── p/[slug]/           # Project profile pages
│   └── projects/           # SSR directory
├── components/             # React components
│   ├── views/              # Page-level view components
│   ├── ui/                 # shadcn/ui primitives
│   └── layouts/            # Layout components
├── lib/                    # Utilities & business logic
│   ├── ranking.ts          # Trust-weighted ranking system
│   ├── citability-scores.ts# Citability score engine
│   ├── geo-score.ts        # GEO score calculation
│   ├── llm-broker.ts       # Multi-provider LLM broker
│   └── mcp/                # MCP Gateway tools
├── prisma/                 # Database schema
└── public/                 # Static assets
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET/POST | List/create projects |
| `/api/projects/[id]` | GET/PATCH/DELETE | Single project CRUD |
| `/api/llm/chat` | POST | Discovery AI streaming chat |
| `/api/llm/scan` | POST | AI autofill scan |
| `/api/mcp` | POST | MCP Gateway (JSON-RPC) |
| `/api/badge/[slug]` | GET | SVG badge generator |
| `/api/llm-feed` | GET | Markdown directory for LLMs |
| `/api/scan` | POST | Public website scan |
| `/api/health` | GET | Health check |
| `/llms.txt` | GET | AI-readable site manifest |
| `/feed.xml` | GET | RSS feed |

## Business Model

CitableHub is **100% free** for listing projects. Revenue comes from optional one-time **GQI Boost** purchases ($100 / $250 / $500) that amplify AI visibility.

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ by <a href="https://citablehub.com">CitableHub</a>
</p>
