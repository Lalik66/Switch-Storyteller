# Action Required: Hero's Forge

Manual steps that **you** (or ops) must complete — they cannot be automated by codegen alone.

## Before / during development (all phases)

- [ ] **Postgres** — Provision a database; set `POSTGRES_URL` in `.env` (see `env.example`).
- [ ] **`BETTER_AUTH_SECRET`** — Generate a strong secret (≥32 characters); required for auth.
- [ ] **`OPENAI_MODERATION_API_KEY`** — OpenAI platform key for `omni-moderation-latest` (child-safety moderation).
- [ ] **`OPENROUTER_API_KEY`** — Required for chat and story AI; pick models via `OPENROUTER_MODEL` / `OPENROUTER_STORY_MODEL_*`.
- [ ] **`NEXT_PUBLIC_APP_URL`** — Match deployed origin (OAuth callbacks, sitemap, auth client base URL); local default often `http://localhost:3001`.
- [ ] **Run migrations** — `pnpm db:generate` when schema changes; `pnpm db:migrate` (or `pnpm db:push` in dev) against your DB.
- [ ] **Google OAuth (optional)** — Create OAuth client in Google Cloud Console; set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; configure authorized redirect URIs for your app URL.

## Storage

- [ ] **`BLOB_READ_WRITE_TOKEN`** — For production uploads/PDF persistence on Vercel Blob; omit in dev to use local `public/` storage (see `src/lib/storage.ts`).

## Phase 2 (when implementing)

- [ ] **Resend** — Account + API key; verify sending domain for parent digest emails.
- [ ] **Vercel Cron** — Configure cron to call `/api/cron/parent-digest` (protect with secret).
- [ ] **ElevenLabs** — API key + voice selection for TTS; cost controls in their dashboard.
- [ ] **Postgres `pgvector`** — Enable extension on your provider (Neon/Supabase/etc.) before character embeddings.

## Phase 3 (when implementing)

- [ ] **Stripe** — Business account, products/prices for tiers; webhook endpoint; test mode for staging.
- [ ] **Lulu xPress** — Developer access, API keys, print spec validation against your PDF export.

## Legal / trust

- [ ] **COPPA / privacy** — Parent-directed flows, data deletion/export, privacy policy — engage counsel per PRD budget (not automated here).

---

> **Note:** These items are also referenced in [`requirements.md`](./requirements.md) and phased tasks in [`implementation-plan.md`](./implementation-plan.md).
