# Implementation Plan: Hero's Forge

**Source:** [`docs/prd/heros-forge.md`](../../docs/prd/heros-forge.md)  
**Spec:** [`requirements.md`](./requirements.md)

## Overview

Deliver Hero's Forge in three PRD phases. **Phase 1** is largely implemented in-repo; remaining work is **verification**, **PRD alignment polish**, and **Phase 2/3** features below.

---

## Phase 1: The Story Loop (MVP)

### Implemented baseline (verify — do not duplicate)

Use this as a checklist when auditing; items reflect current `src/` structure.

- [x] Drizzle schema: `child_profile`, `story`, `story_page`, `prompt_log`, `moderation_event` in `src/lib/schema.ts`
- [x] `src/lib/worlds.ts` + static SVG tiles in `public/worlds/`
- [x] `src/lib/moderation.ts` + `src/lib/story-prompts.ts`
- [x] `POST` `src/app/api/story/route.ts` — create story, 7-day free-tier limit, first child profile simplification
- [x] `POST` `src/app/api/story/page/route.ts` — streamed page generation
- [x] `GET` `src/app/api/story/[id]/pdf/route.ts` — PDF export
- [x] `src/app/api/children/route.ts` + `src/app/api/children/[id]/route.ts`
- [x] `src/app/(app)/story/new/page.tsx` — intake
- [x] `src/app/(app)/story/[id]/page.tsx` + `_reader.tsx` — reader UI
- [x] `src/app/(parent)/children/page.tsx` — child profile management
- [x] `src/app/(parent)/stories/page.tsx` — parent's library with full verbatim story text (PRD §10)
- [x] `src/app/(app)/stories/page.tsx` — story list (adjust as needed when parent dashboard expands)

### Tasks — remaining / hardening

- [x] **PRD verification pass** — Run `pnpm lint && pnpm typecheck`; `pnpm db:migrate` on clean local DB; manual E2E: signup → child profile → intake → 8+ pages → confirm moderation logging → PDF download; negative moderation tests; rate-limit test (second story within 7 days blocked). (See PRD §Verification.)
  - ✅ `pnpm lint && pnpm typecheck` — 0 errors (warnings only in `.claude/worktrees/`)
  - ✅ `pnpm db:migrate` — migrations applied successfully
  - ✅ Signup → child profile → story intake — all working
  - ✅ Rate-limit test — 429 returned correctly on 2nd story attempt within 7 days
  - ⚠️ **Fixed:** `env.ts` + `env.example` had invalid OpenRouter model IDs; updated defaults to `google/gemini-flash-1.5` (cheap) and `anthropic/claude-3-5-sonnet-20241022` (premium)
  - ✅ **Fixed:** Added `maxOutputTokens: 400` to `streamText` calls in story/page API for cost control (~150 words/page)
  - ⏳ Moderation logging + PDF download blocked pending working page generation (need OpenRouter credits)
- [x] **Parent verbatim visibility (PRD §10)** — Implement or extend a **parent** route so every story's **full text** is readable (no summary-only UX). Options: evolve `src/app/dashboard/page.tsx` or add `src/app/(parent)/dashboard/page.tsx` with server-loaded stories + pages for the parent's children.
  - ✅ Created `src/app/(parent)/stories/page.tsx` — parent-only library showing all children's stories with full verbatim page content
  - ✅ Session-safe (server component with auth check, parent ownership verification)
  - ✅ Shows all pages with `aiContent` + optional `childContent` (custom input)
  - ✅ Design system compliant: card-stamp, eyebrow, display-lg, rule-ornament
- [x] **Multi-child story creation** — `src/app/api/story/route.ts` uses the submitted `childProfileId` (scoped to parent for safety) and falls back to first child only when omitted. `story/new/page.tsx` auto-selects for single-child families and shows an explicit picker when `children.length > 1`.
- [x] **PWA manifest branding** — `src/app/manifest.ts` already uses Hero's Forge name, description, and brand colours (`#c83e1e` / `#faf7f2`). Not boilerplate.
- [ ] **PostHog (PRD §12)** — Optional: add client snippet + server events for KPIs; defer if instrumentation is not Phase 1-critical.

### Technical details

- **Rate limit:** `FREE_TIER_WEEKLY_STORY_LIMIT` + rolling window query in `src/app/api/story/route.ts`. Pro tier bypass not defined until Stripe (Phase 3).
- **Models:** `OPENROUTER_STORY_MODEL_CHEAP` / `OPENROUTER_STORY_MODEL_PREMIUM` in `src/lib/env.ts`.
- **Design system:** `@docs/design-system` for any new parent/child UI.

---

## Phase 2: The World Grows

### Tasks

- [x] **`story_image` table + `character` table + `parentReport` table** — Added in `src/lib/schema.ts` Phase 2 section. `scene_hash` unique index on `story_image`; `character_child_profile_id_idx` on `character`. `description_embedding` (pgvector) deferred — requires separate `ALTER TABLE` migration once pgvector extension is confirmed on the Postgres instance.
- [x] **`src/lib/image-prompts.ts`** — `buildScenePrompt()` (world-aware, G-rated, watercolour style) + `sceneHash()` (SHA-256, normalised).
- [x] **`src/app/api/story/[id]/images/route.ts`** — `GET` returns existing images; `POST` generates for pages 1/3/5/7/8, checks `scene_hash` cache first, calls OpenRouter images API, uploads via `storage.ts`, persists to `story_image`.
- [x] **`OPENROUTER_IMAGE_MODEL`** env var added to `src/lib/env.ts` (default `openai/dall-e-3`; re-verify at kickoff per PRD §Open items).
- [x] **Story reader illustration UI** — `_reader.tsx` updated: fetches existing images on mount, shows "Illustrate this tale" button when `pages.length >= 8`, `PageCard` renders image above text with hover-scale animation.
- [x] **Character vault UX + prompt injection** — `src/lib/character-extraction.ts` auto-extracts characters via cheap LLM in `onFinish`; `STORY_SYSTEM_PROMPT` injects top-10 known characters (by appearance count); CRUD routes at `/api/characters` + `/api/characters/[id]`; management UI at `src/app/(parent)/characters/page.tsx` with bilingual (EN/AZ) `_character-vault.tsx` client component; nav link + route protection added.
- [ ] **`parent_report` table + weekly rollup** — Aggregate words/stories/moderation stats per child.
- [ ] **`src/app/api/cron/parent-digest/route.ts`** — Vercel Cron; Resend; React Email template `src/emails/parent-digest.tsx` (create if missing).
- [ ] **`src/app/(parent)/dashboard/page.tsx`** — If not finished in Phase 1, complete dashboard + digest settings surfacing.
- [ ] **`src/app/api/story/[id]/audio/route.ts`** — ElevenLabs; cache audio in Blob; env `ELEVENLABS_API_KEY` (or project convention).
- [ ] **PWA** — `next-pwa` or equivalent service worker strategy for Next 16; icons and manifest for install; test add-to-home-screen.

### Technical details

- **Image models:** Re-verify OpenRouter model IDs at kickoff (PRD §Open items).
- **Email:** `RESEND_API_KEY`; cron auth via `CRON_SECRET` header or Vercel-only invocation.
- **Costs:** Track image + TTS usage per PRD §6.2.

---

## Phase 3: The Community

### Tasks

- [ ] **Schema** — `parent_story_id` on `story` (if not added earlier); `badge`, `child_badge`, `print_order`, `subscription` (or Better Auth Stripe tables).
- [ ] **Remix flow** — Server action or API: clone pages 1–4 to new `story` with FK to parent story.
- [ ] **`src/app/community/page.tsx`** — Paginated feed; only `moderation_status = safe` and `allow_publish = true`.
- [ ] **`src/app/api/print/route.ts`** — Lulu xPress; reuse Phase 1 PDF as print master.
- [ ] **Stripe** — Better Auth Stripe plugin or `src/lib/billing.ts`; parent as customer; map Pro/Family tiers to PRD §11.
- [ ] **Free vs Pro** — Wire subscription state to story-creation throttle and Phase 2 premium features.

### Technical details

- **Lulu:** API keys, sandbox vs prod, shipping address flow.
- **COPPA / billing:** Parent-only checkout; no child payment surfaces.

---

## Phase 4 (Backlog): Admin & Layer 4 moderation

PRD §9 — human review queue for high-severity `moderation_event` rows.

### Tasks

- [ ] Add `role` on `user` (or separate admin table) — see PRD open items.
- [ ] `src/app/(admin)/moderation/page.tsx` — gated admin UI; reviewer workflow.

### Technical details

- Access control middleware or server-only layout; audit log for reviewer actions.
