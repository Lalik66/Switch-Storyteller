# The Hero's Forge — Revised PRD (Switchh Stack Edition)

**Version:** 1.1 | Adapted: 2026-04-14
**Source:** `C:\Users\User\Documents\THE HERO.docx` v1.0 (April 2026)

## Context

The original PRD targeted a FastAPI/Claude-API/Replicate/Hive/React-Native stack. This project (`D:\Switchh`) is a Next.js 16 boilerplate with BetterAuth, Drizzle/Postgres, OpenRouter (via `@openrouter/ai-sdk-provider`), shadcn/ui, and a Vercel-Blob-or-local storage abstraction. The PRD must be rewritten end-to-end so that every architectural decision, cost estimate, file path, and vendor reference reflects the actual stack we are building on. This document is the adapted PRD only — implementation steps will be planned separately once this PRD is approved.

Current state of the boilerplate (for grounding):
- Auth fully implemented: BetterAuth + Google OAuth + email/password (`src/lib/auth.ts`, `src/lib/auth-client.ts`).
- DB schema is only auth tables (`user`, `session`, `account`, `verification` in `src/lib/schema.ts`). No domain tables exist.
- A generic AI chat route exists at `src/app/api/chat/route.ts` using `streamText` + OpenRouter + Zod validation, gated on session.
- `src/lib/storage.ts` provides dual-mode uploads (Vercel Blob prod / local `public/uploads` dev).
- 15 shadcn/ui components already available (button, card, dialog, dropdown-menu, input, label, avatar, badge, separator, skeleton, textarea, spinner, mode-toggle, sonner, github-stars).
- No story/kids/hero's-forge code yet — this is a greenfield domain layer on top of the boilerplate.

---

## 1. Executive Summary

The Hero's Forge is an AI-powered collaborative storytelling web app for children ages 7–12, built as a domain layer on top of the Switchh Next.js 16 boilerplate. Children co-author illustrated stories with an AI partner, earn printable books, and share safe remixes in a moderated community. Value propositions (engagement, education, monetization, safety, social stickiness) are unchanged from v1.0; the realization is fully Next.js-native.

**Market & revenue targets unchanged:** 150M global 7–12 TAM, 8 USD/mo Pro, 50k Pro = ~4.8M ARR.

---

## 2. Product Overview

**Vision, problem, and solution are unchanged from v1.0.** Success criteria unchanged: zero safety incidents, parent trust >4.5/5, completion rate >40%, print export >30%.

---

## 3. Target Audience

Unchanged from v1.0. Primary: children 7–12. Secondary: parents 30–55. Tertiary: educators.

Parent accounts are the billable entity; child profiles are sub-profiles under a parent `user` row (see §7).

---

## 4. Core Features and Phases

### 4.1 Phase 1 MVP (Months 1–4): The Story Loop

Goal unchanged: prove the AI+child co-authorship loop.

**Features:**
- **Drafting Buddy**: 3-question intake (hero, setting, problem) implemented as a multi-step form using existing shadcn `card`/`input`/`button`.
- **Art-First World Selection**: pre-made world tiles rendered from a static manifest (`src/lib/worlds.ts`). Phase 1 tile art is static assets in `public/worlds/` — no runtime image generation.
- **Interactive Story Pages**: AI generates a page (~150 words) + 3 action buttons; child can also type a custom action. Uses Vercel AI SDK `streamText` over a new route `src/app/api/story/page/route.ts`.
- **Story Progress Tracking**: page count, word count, chapter count — surfaced on `src/app/story/[id]/page.tsx`.
- **Safety Layer v1**: pre-prompt + post-generation moderation via OpenAI's free `omni-moderation-latest` endpoint wrapped in `src/lib/moderation.ts`. System-prompt guardrails enforced in the story route.
- **PDF Export**: server-route `src/app/api/story/[id]/pdf/route.ts` using `@react-pdf/renderer` or `pdfkit`, streamed as a download; writes through `src/lib/storage.ts` when persistence is needed.

**Tech stack (actual):**
- Framework: **Next.js 16 App Router + React 19 + TypeScript** (already in place).
- AI: **OpenRouter via `@openrouter/ai-sdk-provider`**, tiered:
  - `anthropic/claude-haiku-4.5` for per-page generation (cheap, fast, in-range for kids vocab).
  - `anthropic/claude-sonnet-4-6` for chapter openers, finales, and vocabulary-sensitive passages.
  - Env var `OPENROUTER_STORY_MODEL_CHEAP` / `OPENROUTER_STORY_MODEL_PREMIUM`.
- Auth: **BetterAuth** (existing). Add child-profile sub-entity.
- DB: **PostgreSQL + Drizzle ORM** (existing). Schema additions in §7.
- Moderation: **OpenAI `omni-moderation-latest`** (free; keyed via `OPENAI_MODERATION_API_KEY`).
- Storage: **`src/lib/storage.ts`** (Vercel Blob in prod, local in dev) — already built.
- Hosting: **Vercel** (single deployment target; no separate Railway service needed).

**Estimated Phase 1 cost:** ~$60–80k (lower than v1.0's $100k — no separate Python backend, no React Native MVP, reuse of auth/storage/chat plumbing).

### 4.2 Phase 2 (Months 5–8): The World Grows

- **Image Generation**: Selective (5 images per 8-page story) via OpenRouter image-capable models (e.g., `google/gemini-2.5-flash-image` or `openai/gpt-image-1`). Route: `src/app/api/story/[id]/images/route.ts`. Images persisted through `src/lib/storage.ts` → Vercel Blob. Caching layer keyed on scene-hash in a new `story_images` table.
- **Character Vault**: `character` table with a `description_embedding` column (pgvector via `drizzle-orm/pg-core` custom type) used to keep character descriptions consistent across pages; the embedding is injected into the system prompt rather than relying on image-model IP-consistency.
- **Mobile**: **PWA-first** instead of React Native. Next.js 16 PWA manifest + service worker; add to home screen on iOS/Android. A separate React Native app is deferred to post-Phase 3 and is not in this PRD.
- **Parental Dashboard**: new protected route `src/app/(parent)/dashboard/page.tsx`. Weekly email digest via a Vercel Cron job hitting `src/app/api/cron/parent-digest/route.ts`; transactional email via Resend (`RESEND_API_KEY`).
- **Audio Narrator**: ElevenLabs TTS via `src/app/api/story/[id]/audio/route.ts`, audio cached in Blob storage. ElevenLabs stays as the best-in-class kid-voice vendor; it is the only non-OpenRouter AI vendor in Phase 2.

**Estimated Phase 2 cost:** ~$110k.

### 4.3 Phase 3 (Months 9–12): The Community

- **Remix Button**: clones story pages 1–4 into a new `story` row with `parent_story_id` FK.
- **Community Feed**: `src/app/community/page.tsx` — server-rendered paginated feed; all entries gated on `moderation_status = 'safe'` AND parental `allow_publish = true`.
- **Print-on-Demand**: Lulu xPress API integration in `src/app/api/print/route.ts`. PDF from Phase 1 is reused as the print master.
- **Achievement Badges**: `badge`, `user_badge` tables; awarded by server action after each page save.
- **Pro Subscription**: Stripe (via BetterAuth's Stripe plugin or standalone `@/lib/billing.ts`). Not Polar — Stripe has better COPPA-friendly parent-billing ergonomics.

**Estimated Phase 3 cost:** ~$140k.

---

## 5. User Flow Example

Emma's flow unchanged from v1.0 §5, with these mapping notes:
- "Opens app" = navigates to `https://herosforge.app/` (PWA). Parent has previously created her child profile.
- "App formats story into PDF" = `GET /api/story/:id/pdf` streams a `@react-pdf/renderer` document.
- "Weekly report" = Vercel Cron → Resend email, rendered from `src/emails/parent-digest.tsx` (React Email).

---

## 6. Language Support

The Hero's Forge supports two languages at launch:
- **Azerbaijani** (primary)
- **English** (secondary, targeting Azerbaijani-speaking families)

### Technical Requirements
- Use `next-intl` for frontend internationalization
- All UI strings stored in `/locales/en.json` and `/locales/az.json`
- Language selector in onboarding (child picks language at signup)
- AI prompts instruct Claude to respond in the selected language
- Story content, action buttons, and Drafting Buddy questions all rendered in the selected language
- Parental dashboard and weekly reports also localized
- Content moderation configured per language

### Language Detection
Default language is auto-detected from browser settings, with manual override always available.

---

## 7. Technical Architecture

### 7.1 System Components (Switchh mapping)

| Concern | v1.0 PRD | Revised |
|---|---|---|
| Frontend (web) | React SPA | Next.js 16 App Router (existing) |
| Frontend (mobile) | React Native | PWA (Phase 2); native deferred |
| Backend | FastAPI / Node | Next.js Route Handlers (`src/app/api/**`) |
| LLM | Claude API direct | OpenRouter (`@openrouter/ai-sdk-provider`) tiered Haiku/Sonnet |
| Image gen | Stable Diffusion 3 / Replicate | OpenRouter image models (gemini-2.5-flash-image / gpt-image-1) |
| Moderation | Hive | OpenAI `omni-moderation-latest` (free) + LLM guardrails |
| Structured DB | Postgres | Postgres + Drizzle (existing) |
| Cache | Redis | Next.js `unstable_cache` + Postgres; Redis only if measured need |
| Object store | S3 | Vercel Blob via `src/lib/storage.ts` (existing) |
| Auth | Custom | BetterAuth (existing) |
| Email | — | Resend + React Email |
| Cron | — | Vercel Cron |
| Billing (Phase 3) | Stripe | Stripe via BetterAuth plugin |
| TTS (Phase 2) | ElevenLabs | ElevenLabs (unchanged) |
| POD (Phase 3) | Lulu / IngramSpark | Lulu xPress API |

### 7.2 Cost Estimates (revised to this stack)

- Claude Haiku 4.5 via OpenRouter: ~$1/M input, ~$5/M output → ~$0.003–0.006 per 150-word page.
- Claude Sonnet 4.6 via OpenRouter (used ~15% of pages): ~$0.02 per page.
- Blended per-page LLM cost: ~$0.005 — matches v1.0 target.
- Image gen via OpenRouter (gemini-2.5-flash-image): ~$0.03/image → $0.15 per 5-image story.
- Moderation: $0 (OpenAI `omni-moderation-latest` is free).
- At 10k stories/month: ~$1.5–2k blended API spend (consistent with v1.0 range).

---

## 8. Database Schema (Drizzle/Postgres additions)

Additions go in `src/lib/schema.ts` alongside existing BetterAuth tables. All timestamps use `timestamp({ withTimezone: true })`.

**Phase 1 tables:**
- `child_profile` — `id`, `parent_user_id` (FK→`user.id`), `display_name`, `age`, `avatar_url`, `content_strictness` (`'standard'|'strict'`), `allow_publish` (bool, default false), `allow_remix` (bool, default false), `daily_minute_limit` (nullable int), `created_at`.
- `story` — `id`, `child_profile_id` (FK), `title`, `world_key` (FK→static worlds manifest), `hero_name`, `problem_text`, `status` (`'draft'|'complete'|'published'|'archived'`), `word_count`, `chapter_count`, `parent_story_id` (nullable, for remixes — added in Phase 3 migration), `moderation_flags` (jsonb), `created_at`, `updated_at`.
- `story_page` — `id`, `story_id` (FK), `page_number`, `ai_content` (text), `child_content` (text, nullable), `chosen_action_key` (nullable), `moderation_status` (`'pending'|'safe'|'flagged'`), `model_used` (text), `token_usage` (jsonb), `created_at`.
- `prompt_log` — `id`, `story_id` (FK), `original_prompt`, `moderated_prompt`, `moderation_action` (`'blocked'|'sanitized'|'allowed'`), `created_at`.
- `moderation_event` — `id`, `story_id` (FK), `flagged_content`, `reason`, `severity` (`'low'|'medium'|'high'`), `action_taken`, `reviewed_by_human` (bool), `created_at`.

**Phase 2 tables:**
- `character` — `id`, `child_profile_id` (FK), `name`, `description`, `description_embedding` (pgvector, 1536 dims), `image_url` (via storage.ts), `appearance_count`, `created_at`.
- `story_image` — `id`, `story_page_id` (FK), `url`, `scene_hash`, `model_used`, `created_at`. Indexed on `scene_hash` for cache reuse.
- `parent_report` — `id`, `parent_user_id` (FK), `child_profile_id` (FK), `week_ending`, `stories_created`, `total_words_written`, `vocabulary_highlights` (jsonb), `moderation_incidents`, `sent_at`.

**Phase 3 tables:**
- `badge`, `child_badge`, `print_order` (Lulu order id, status, shipping), `subscription` (if not handled by BetterAuth plugin).

**Indexes:**
- `story (child_profile_id, created_at desc)`
- `story_page (story_id, page_number)`
- `moderation_event (severity, created_at desc)`
- `character (child_profile_id)`
- `story_image (scene_hash)`

Migrations are generated via `pnpm db:generate` and applied via `pnpm db:migrate` (already wired into `pnpm build`).

---

## 9. Image Generation Strategy

- **Phase 1:** no generated images. World tiles are static assets in `public/worlds/`.
- **Phase 2:** selective (5 images per 8-page story, pages 1/3/5/7/8), generated on story completion only. OpenRouter image models; default `google/gemini-2.5-flash-image`. Cached by `scene_hash` (SHA-256 of normalized scene description). Target 20–30% cache hit reduction as in v1.0.
- **Cost projections (revised):** at $0.03/image and 5 images/story:
  - 1k stories/mo ≈ $150
  - 5k stories/mo ≈ $750
  - 10k stories/mo ≈ $1,500
  (Slightly higher than v1.0's Replicate numbers but consolidates vendors onto a single OpenRouter key.)

---

## 10. Safety and Moderation

Four-layer architecture from v1.0 preserved, re-homed onto this stack:

- **Layer 1 — Pre-prompt:** `src/lib/moderation.ts#moderatePrompt()` calls OpenAI `omni-moderation-latest` before any child input reaches the story route. Blocked prompts return a kid-friendly redirect message; no punitive UX.
- **Layer 2 — LLM guardrails:** a single canonical system prompt in `src/lib/story-prompts.ts` enforces G-rated tone, 4th–5th-grade vocabulary ceiling, and a deny-list. Injected by both story and remix routes so there is one source of truth.
- **Layer 3 — Post-generation:** every AI page is re-scanned via `moderatePrompt()` before streaming to the child. Flagged content triggers a transparent regeneration attempt (max 2 retries) before falling back to a safe canned page. All events logged to `moderation_event`.
- **Layer 4 — Human review:** high-severity rows in `moderation_event` surface in an internal admin route (`src/app/(admin)/moderation/page.tsx`, gated by a `role='admin'` field to be added to `user`). Budget: $2–3k/mo part-time reviewers — unchanged from v1.0.

Prohibited categories and incident response are unchanged from v1.0 §9.3–9.4. **COPPA compliance** is non-negotiable: no ad tracking, no data sale, parent-verified account creation, data export/deletion on request.

---

## 11. Parental Controls and Transparency

- **Dashboard route:** `src/app/(parent)/dashboard/page.tsx`, Server Component, session-gated.
- **Weekly email:** Vercel Cron → `/api/cron/parent-digest` → Resend, rendered from `src/emails/parent-digest.tsx` (React Email).
- **Settings** (stored on `child_profile`): allow community publishing, allow remixing, daily usage limit, content strictness (standard / strict).
- **Full readability:** every story the child creates is readable verbatim in the parent dashboard — no summaries substituted for raw text.

---

## 12. Monetization

Tiers, pricing, and print margins unchanged from v1.0 (Free / Pro $7.99 / Family $19.99; print-on-demand 20–30% margin via Lulu). Implementation notes:
- Stripe via BetterAuth's Stripe plugin (cleaner integration than rolling our own). Parent is the billable entity.
- Print orders flow through `src/app/api/print/route.ts` → Lulu xPress API, with the PDF master reused from Phase 1 export.
- Free tier: 1 story/week throttle enforced at the story-creation route via a Drizzle count query on `story (child_profile_id, created_at >= now() - interval '7 days')`.

---

## 13. Success Metrics and KPIs

Unchanged from v1.0 §12 (story completion >40%, MAU retention >60%, ≥200 words/mo/child, remix participation >20%, free→Pro 8–12%, print adoption >30%, CAC <$15, LTV >$200). Instrumentation: PostHog client snippet in `src/app/layout.tsx`, server events via PostHog Node in route handlers. Safety metrics derived from `moderation_event` aggregates.

---

## 14. Development Timeline

Timeline unchanged from v1.0 (12 months, 3 phases) but Phase 1 is compressed because the boilerplate already provides auth, storage, an AI streaming route, and 15 shadcn components. Concretely, Phase 1 reallocates ~3–4 weeks from infra setup to gameplay polish and beta iteration.

---

## 15. Budget and Resources

Revised Year 1 budget: **~$330k** (v1.0 was $380k).
- Engineering: $160k (one full-stack FTE; boilerplate saves ~4 weeks).
- Design/UX: $40k.
- Content moderation: $30k.
- Infra/cloud (Vercel + Neon/Supabase Postgres + Blob): $12k.
- API costs (OpenRouter + ElevenLabs + Resend): $22k.
- Marketing: $35k.
- Legal/COPPA compliance review: $18k (slightly higher — COPPA legal is load-bearing).
- Contingency (~4%): $13k.

Key hires unchanged from v1.0 §14.2.

---

## Critical Files to Create / Modify (Phase 1, for the eventual implementation plan)

- `src/lib/schema.ts` — add `child_profile`, `story`, `story_page`, `prompt_log`, `moderation_event`.
- `src/lib/worlds.ts` — static world manifest + types.
- `src/lib/moderation.ts` — OpenAI moderation wrapper, `moderatePrompt()` / `moderateOutput()`.
- `src/lib/story-prompts.ts` — canonical system prompt + guardrails.
- `src/app/api/story/page/route.ts` — streaming page generation (mirrors existing `src/app/api/chat/route.ts` pattern: session check, Zod validation, `streamText` over `@openrouter/ai-sdk-provider`).
- `src/app/api/story/[id]/pdf/route.ts` — PDF export.
- `src/app/(app)/story/new/page.tsx` — 3-question intake flow.
- `src/app/(app)/story/[id]/page.tsx` — reader + action buttons + custom-action textarea.
- `src/app/(parent)/children/page.tsx` — child profile management.

Reuse existing:
- `src/lib/auth.ts` + `src/lib/auth-client.ts` (BetterAuth) — parent auth.
- `src/lib/storage.ts` — all file I/O (PDFs, images).
- `src/app/api/chat/route.ts` — reference pattern for new AI routes.
- shadcn components in `src/components/ui/` — no new primitives needed for Phase 1.

---

## Verification (how to prove the adapted PRD is buildable on this stack)

Once this PRD is approved and an implementation plan is generated, Phase 1 verification will include:
1. `pnpm lint && pnpm typecheck` clean after each milestone (per `CLAUDE.md` CRITICAL RULES).
2. `pnpm db:generate` + `pnpm db:migrate` applied cleanly against a local Postgres.
3. End-to-end manual test: parent signs up → creates child profile → child completes a 3-question intake → at least 8 pages stream in → moderation logs show every input and output was scanned → PDF export downloads successfully.
4. Moderation negative test: a crafted unsafe prompt is blocked at Layer 1 AND a simulated unsafe LLM completion is caught at Layer 3, with both events written to `moderation_event`.
5. Rate-limit test: free-tier child cannot create a second story within 7 days.
6. No image generation, no mobile app, no community feed, no billing in Phase 1 — those are explicitly Phase 2/3 scope.

---

## Open items deferred to the implementation plan

- Choice of PDF library (`@react-pdf/renderer` vs `pdfkit`) — decide during Phase 1 kickoff based on print-fidelity tests with Lulu's PDF spec.
- Whether to add Redis for rate limiting or rely on Postgres counts (default: Postgres until measured need).
- Exact OpenRouter model IDs for image generation — re-verify availability at Phase 2 kickoff.
- Admin role model — add `role` column to `user` table vs. a separate `admin_user` table.
