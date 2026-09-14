# The Hero's Forge

An AI storytelling app for children aged 7–12 and their parents. Parents own the account and set the rules; children co-write illustrated, page-by-page adventures under a child profile — safely, and in English or Azerbaijani.

## What it does

- **Parent accounts.** Parents sign up, add child profiles (name, age, content strictness, optional daily limits), and set sharing rules.
- **Co-written tales.** A 3-step wizard (hero → world → story problem) starts an adventure. The AI writes each page; the child picks one of three actions or writes their own; the story continues page by page.
- **Finish & keep.** Completed stories export to a PDF. Stories can optionally be published to the community feed when the parent enables it for that child.
- **Parent oversight.** A dashboard (stories, words, pages, moderation) plus a full story library where parents can read every page, and a weekly digest email.
- **Safety first (COPPA-minded).** Multi-layer moderation gates prompts before generation and screens output after, with an admin human-review queue and per-child content strictness.
- **Bilingual.** Full UI in English and Azerbaijani.
- **Free tier.** About one new story per week per child.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Drizzle ORM + PostgreSQL · Better Auth (email + password) · Vercel AI SDK via OpenRouter · OpenAI moderation · Resend (transactional email) · ElevenLabs (narration) · Vercel Blob (storage) · next-intl.

## Getting started

```bash
# 1. Start Postgres (Docker)
docker compose up -d

# 2. Configure environment
cp env.example .env      # then fill in the keys

# 3. Install, migrate, run
pnpm install
pnpm db:migrate
pnpm dev                 # http://localhost:3001
```

Schema changes always go through `pnpm db:generate` then `pnpm db:migrate` — never `db:push`.

## Design system

The look is the **"Illuminated Grimoire"** — a warm, editorial illuminated-manuscript aesthetic. Its tokens live in `src/app/globals.css` and are **locked** (see the `DESIGN TOKENS — LOCKED` block); restyling requires written owner approval. Full documentation is in [`docs/design-system/`](docs/design-system/), and the standing constraints are in [`DESIGN.md`](DESIGN.md).

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server (port 3001, Turbopack) |
| `pnpm build` | Production build (runs `db:migrate` first) |
| `pnpm check` | Lint + typecheck |
| `pnpm test` | Vitest suite |
| `pnpm db:generate` / `db:migrate` | Generate and apply schema migrations |
| `pnpm db:studio` | Drizzle Studio |

## Roadmap

Story loop, images, character vault, PWA, parent digest, narration, remix and community are built. The community feed ships behind the `COMMUNITY_ENABLED` flag pending safety sign-off. Stripe billing and Lulu print-on-demand are the deferred final milestone.
