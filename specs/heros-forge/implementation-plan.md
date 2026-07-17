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
  - **2026-07-17 verification attempt** (OpenRouter credits funded, $5):
    - ✅ Signup → child profile → intake all pass against the live dev server (E2E script)
    - ✅ Page generation streams — `anthropic/claude-sonnet-4.6` produced a real 2.6 KB opener
    - ⚠️ **Fixed (again):** all three model defaults had rotted — `claude-3.5-haiku`, `claude-3-5-sonnet-20241022`, and `openai/dall-e-3` no longer resolve. Replaced with `claude-haiku-4.5` / `claude-sonnet-4.6` / `gemini-2.5-flash-image`, each verified against `GET /api/v1/models` (PR #9)
    - ⛔ ~~Still blocked~~ — the OpenAI account behind `OPENAI_MODERATION_API_KEY` returned persistent 429; owner restored the account same day.
  - ✅ **2026-07-17 (account restored): FULL E2E PASS.** Fresh signup → child profile → intake → **8/8 pages** persisted, all `moderation_status='safe'`; tiered models verified in `model_used` (pages 1/5/8 = `sonnet-4.6`, mid = `haiku-4.5`); `prompt_log` = 7 `allowed` + 1 `blocked`; **negative test** returned the kid-friendly redirect and created no page; **PDF** downloaded (200, `application/pdf`, 18,581 bytes); `word_count`/`chapter_count` updated live (1724 / 2 — PR #6 fix confirmed); Phase 2 character extraction populated the vault as a side-effect. Remaining nuance: a forced-unsafe **LLM completion** (Layer 3 retry/canned-fallback path) cannot be simulated against a live model — verified by code-reading only.
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
  - ✅ **Re-verified 2026-07-17:** `openai/dall-e-3` and `openai/gpt-image-1` are dead on OpenRouter; default changed to `google/gemini-2.5-flash-image` (PRD §4.2's first choice, confirmed live). PR #9. Live image *generation* not yet exercised.
- [x] **Story reader illustration UI** — `_reader.tsx` updated: fetches existing images on mount, shows "Illustrate this tale" button when `pages.length >= 8`, `PageCard` renders image above text with hover-scale animation.
- [x] **Character vault UX + prompt injection** — `src/lib/character-extraction.ts` auto-extracts characters via cheap LLM in `onFinish`; `STORY_SYSTEM_PROMPT` injects top-10 known characters (by appearance count); CRUD routes at `/api/characters` + `/api/characters/[id]`; management UI at `src/app/(parent)/characters/page.tsx` with bilingual (EN/AZ) `_character-vault.tsx` client component; nav link + route protection added.
- [x] **`parent_report` table + weekly rollup** — `src/lib/parent-report.ts` aggregates stories/words/pages/moderation incidents per child per week; persists to `parent_report` table; marks rows as sent after email delivery.
- [x] **`src/app/api/cron/parent-digest/route.ts`** — Vercel Cron (`vercel.json`, Sundays 9 AM UTC); authenticates via `CRON_SECRET`; iterates all parents, builds digest, renders `src/emails/parent-digest.tsx` (React Email), sends via Resend, skips inactive parents. `RESEND_API_KEY` + `CRON_SECRET` added to `src/lib/env.ts`.
- [x] **`src/app/(parent)/parent/dashboard/page.tsx`** — Full parent dashboard: per-child stats (stories, words, pages, characters, moderation incidents this week), aggregate totals, quick links to stories library / character vault / children manager, last digest sent date. Design-system compliant (card-stamp, eyebrow, StatCard, DashboardStat). Nav link added.
- [x] **`src/app/api/story/[id]/audio/route.ts`** — ElevenLabs TTS via `src/lib/audio.ts` (`audioHash` SHA-256 cache key on text+voice+model, `synthesize()` calls `POST /v1/text-to-speech/{voice}?output_format=mp3_44100_128`). New `story_audio` table (migration `0004_friendly_iron_fist.sql`) caches MP3s by hash so identical pages reuse a single Blob upload. `GET` lists cached tracks; `POST { pageNumber? }` synthesises one page or all. Env vars: `ELEVENLABS_API_KEY` (optional), `ELEVENLABS_VOICE_ID` (default Rachel `21m00Tcm4TlvDq8ikWAM`), `ELEVENLABS_MODEL_ID` (default `eleven_turbo_v2_5`). Storage allowlist extended to `audio/mpeg` + `.mp3`. Reader UI (`_reader.tsx`) wires per-page narrate button → inline `<audio controls preload="none">` once URL is known; bilingual EN/AZ copy.
- [x] **PWA install** — `@ducanh2912/next-pwa` already configured in `next.config.ts` (dev-disabled, offline fallback `/offline`). Closed remaining install gaps: rasterized brand icon (`public/icons/icon-source.svg` + `scripts/generate-pwa-icons.mjs` using `sharp`) into `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (purpose `maskable`), `apple-touch-icon.png` (180×180). Manifest (`src/app/manifest.ts`) updated with `id`, `scope`, `orientation`, `categories`, three properly-sized icons. Layout metadata (`src/app/layout.tsx`) adds `icons.icon` / `icons.apple` / `appleWebApp.{capable,title,statusBarStyle}` + `viewport.themeColor`. Verified: manifest serves 200, all icon files serve 200, head emits `<link rel="manifest">`, `<link rel="icon" sizes="192x192|512x512">`, `<link rel="apple-touch-icon" sizes="180x180">`, `<meta name="mobile-web-app-capable">` (Next 16 uses W3C-standard name; Safari ≥16.4 reads it), `<meta name="apple-mobile-web-app-status-bar-style|title">`, `<meta name="theme-color" content="#c83e1e">`.

### Technical details

- **Image models:** Re-verify OpenRouter model IDs at kickoff (PRD §Open items).
- **Email:** `RESEND_API_KEY`; cron auth via `CRON_SECRET` header or Vercel-only invocation.
- **Costs:** Track image + TTS usage per PRD §6.2.

---

## Phase 3: The Community

> **Unblocked 2026-07:** Phase 4 (Layer 4 human review) is complete, satisfying the plan's stated COPPA precondition for the community feed. Remix + feed shipped in PR #2 (ledger below); remaining Phase 3 work is Lulu print, then Stripe (last), then Free-vs-Pro wiring.

> **Provenance (recorded 2026-07-17):** the Phase 3 community slice shipped in **PR #2** (`claude/optimistic-vaughan-f34886`, merge `1f6ab07`, titled "feat(phase3): community + remix + badges") on 2026-05-07 — deliberately built early, the same out-of-phase ordering the plan already documents for Phase 4 (COPPA gate). Its checkboxes below were simply never updated at merge; corrected now. The original single compound "Schema" bullet is split per-item so no `[x]` bundles an unbuilt item.

### Schema

- [x] `parent_story_id` on `story` — set-null self-FK + `story_parent_story_id_idx`. **Shipped in PR #2** (migration `0006_open_mentallo.sql`).
- [x] `child_badge` table — unique `(child_profile_id, badge_key)` index + awarded-at index. **Shipped in PR #2** (migration `0007_aspiring_marvel_zombies.sql`). Both 0006 and 0007 are inside the 0000→0008 chain replayed from empty on 2026-07-17.
- **`badge` table — intentionally NOT built (not a task).** The badge catalog is a code constant in `src/lib/badges.ts` (drift-safe "Unknown badge" rendering); there is no `badge` table by design. The original compound bullet listed one in error.
- [ ] `print_order` table — unbuilt; lands with Lulu print (below).
- [ ] `subscription` / Better Auth Stripe tables — unbuilt; lands with Stripe (below).

### Features

- [x] **Remix flow** — **Shipped in PR #2**: `POST /api/story/[id]/remix` clones up to 4 moderation-safe pages in one transaction, gates on source `status='published'` + `allowPublish` + `allowRemix`, applies the free-tier weekly limit to the remixer, and re-evaluates badges.
- [x] **Community feed** (`src/app/community/page.tsx`) — **Shipped in PR #2**: paginated server-rendered feed gated on `story.status='published' AND child_profile.allow_publish`; public reader (`community/[id]`) additionally renders only `moderation_status='safe'` pages. Publish gates live in `POST /api/story/[id]/publish` (≥4 pages, all safe, parental consent, idempotent).
- [x] **Badges** — **Shipped in PR #2**: catalog of 6 as a code constant in `src/lib/badges.ts`, race-safe `awardBadges()` via `onConflictDoNothing` on the `(child_profile_id, badge_key)` unique index, awarded from the complete/publish/remix routes, earned-chip UI + i18n `Badges` namespace. The `wordsmith` badge only became earnable after the word-count fix (PR #6).
- [ ] **Lulu print** (`src/app/api/print/route.ts`) — unbuilt. Lulu xPress; reuse Phase 1 PDF as print master.
- [ ] **Stripe** — unbuilt. Better Auth Stripe plugin or `src/lib/billing.ts`; parent as customer; map Pro/Family tiers to PRD §11. **Owner decision: last milestone of the project.**
- [ ] **Free vs Pro** — unbuilt; blocked on Stripe. Wire subscription state to the story-creation throttle and Phase 2 premium features.

### Technical details

- **Lulu:** API keys, sandbox vs prod, shipping address flow.
- **COPPA / billing:** Parent-only checkout; no child payment surfaces.

---

## Phase 4: Admin & Layer 4 moderation

PRD §9/§10 — human review queue for high-severity `moderation_event` rows. **Built before Phase 3 community feed** because the feed cannot ship without a Layer 4 reviewer workflow under COPPA.

### Tasks

- [x] **`role` on `user` table** — Postgres enum `user_role` (`user` | `admin`), default `user`. Added in `src/lib/schema.ts`. Migration `0005_fantastic_wild_child.sql` creates the enum and column.
- [x] **Reviewer audit columns on `moderation_event`** — added `reviewedBy` (FK→user.id, set-null on delete), `reviewedAt`, `reviewerNotes`. Kept the existing `reviewedByHuman` boolean for back-compat (set true when a review is recorded). New `moderation_event_unreviewed_idx` on `(reviewedByHuman, createdAt desc)` for the queue's most-common filter.
- [x] **`requireAdmin()` helper** — `src/lib/session.ts`; loads role via Drizzle, redirects non-admins to `/dashboard` (never tells a parent the admin route exists). `protectedRoutes` and `src/proxy.ts` matcher both extended with `/admin` + `/admin/:path*` for the optimistic-redirect layer.
- [x] **(admin) route group** — `src/app/(admin)/layout.tsx` calls `requireAdmin()` on every render; gates everything under it.
- [x] **`src/app/(admin)/admin/moderation/page.tsx`** — Server Component queue. Loads up to 100 events in one query, ordered: unreviewed-first (boolean ASC) → severity bucket (high → low via `CASE` expression — Postgres enums sort lexicographically by default, which would put "low" above "medium") → `createdAt desc`. LEFT JOIN to `user` exposes the reviewer's name for already-resolved rows. Client child `_queue.tsx` renders each event as a card with severity chip, verbatim flagged content, action taken, link back to the story, and a per-row notes textarea + "Mark reviewed" button.
- [x] **`POST /api/admin/moderation/[id]/review`** — `src/app/api/admin/moderation/[id]/review/route.ts`. Re-checks `requireAdmin()` (route handlers don't run inside the (admin) layout — belt and braces). Zod-validated body `{ notes? max 500 chars }`. Updates the row with reviewerId/timestamp/notes; returns the new audit fields. 403 on non-admin (clean JSON, not a redirect HTML body), 404 on missing event.

### Technical details

- **Severity ranking:** explicit `CASE` expression in the queue query — never trust enum default sort.
- **Audit shape:** denormalised onto `moderation_event` rather than a separate `moderation_review` table. v1 captures who/when/why; a per-event reviewer history isn't needed yet (PRD §10 calls for an audit trail, not a changelog).
- **Nav surfacing:** intentionally NOT added to `MainNavLinks` — the BetterAuth client session doesn't carry the role yet (would need `additionalFields` config). Reviewers bookmark `/admin/moderation`. Add a nav link in a follow-up if reviewer roster grows.
- **Verification:** `pnpm typecheck` clean; `pnpm lint` 0 errors; `pnpm db:generate` produced `0005_fantastic_wild_child.sql`; preview server confirmed (admin) layout + page + API route all compile cleanly; proxy emits 3xx `opaqueredirect` for unauthenticated `/admin` and `/admin/moderation` requests.

### Promoting your first admin

The role column ships with default `user`. To promote yourself after `pnpm db:migrate`:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
```

No UI for role grants in v1 — deliberate. Admin promotion is a privileged operation and should leave a SQL trail.

---

## Housekeeping & template removal (2026-07)

Full evidence in [`docs/audit/AUDIT-2026-07-16.md`](../../docs/audit/AUDIT-2026-07-16.md). Standing constraints now live in [`DESIGN.md`](../../DESIGN.md) — notably: **the Resend-verified sending domain is `mail.herosforge.app` (subdomain), never the bare apex**.

### Removed (with why)

- [x] `src/lib/landing-copy.ts` — inline `{en,az}` dictionary superseded by the `Landing` messages namespace (i18n migration part 2, PR #5).
- [x] `src/components/site-footer.tsx` — superseded by `localized-site-footer.tsx`; zero imports (PR #8).
- [x] `src/app/(parent)/library/page.tsx` — near-verbatim duplicate of `/parent/stories` (which adds the publish toggle); no inbound links (PR #8).
- [x] `public/{next,vercel,file,globe,window}.svg` — starter-template assets, unreferenced (PR #8).
- [x] ~3.1 GB of stale worktrees/branches under `.claude/worktrees/` — 50 worktrees and ~60 fully-merged branches removed 2026-07-16 (tooling state, not source).

### Boilerplate still present (deletion pending owner review)

Not part of the product; the PRD referenced them only as the "reference pattern" for new AI routes:

- [ ] `src/app/chat/*` + `src/app/api/chat/route.ts` — demo AI chat. Inbound refs: old `/dashboard` page, `protectedRoutes` (`session.ts`), proxy matcher, `OPENROUTER_MODEL` env + `env.example` comment, README feature list.
- [ ] `src/app/api/diagnostics/route.ts` + `src/hooks/use-diagnostics.ts` — setup-wizard health check; consumed only by the old `/dashboard` page.
- [ ] `src/app/dashboard/*` — template hub. Post-login redirects repointed to `/parent/dashboard` in PR #10; remaining plain links (`not-found`, `offline`, `story/new`, `user-profile`) move in the deletion PR.

---

## Open items (cross-phase)

- [x] **Digest/email locale** — owner approved option A: `user.locale` column (migration 0008), captured at signup, synced by the language switcher (PR #11). Email templates still render English — wiring `locale` through rides with the `Emails.*` i18n batch.
- [x] **OpenAI moderation account** — was returning persistent 429 (ops, not code); owner restored it 2026-07-17 and the full E2E passed.
- [x] **Drizzle migration journal drift + stray `story.published_at`** — RESOLVED by owner-ruled rebaseline (2026-07-17): confirmed no repo migration or source file ever creates `published_at` (worktree-era residue only), dropped and recreated the local dev DB from empty, and ran the full chain `0000 → 0008` through `pnpm db:migrate` — **all 9 applied cleanly**, 14 tables, `user.locale` correct, stray column gone. Migration 0008 has now executed through the real migrate path. `db:push` remains NOT blessed for local dev.
- [x] **Stream-failure masking + classification** — RESOLVED (PR #12). The forced-error experiment proved model failures leaked the provider's raw message to the child (AI SDK v5's default `toUIMessageStreamResponse` `onError` returns `error.message` verbatim). Fixed both leak points: server `onError` now returns a classified code (`transient` | `hard_config`) via the pure `classifyStreamError()` in `src/lib/stream-errors.ts` and logs the real details server-side; the client renders only its own translated copy and never a server string. The page is not lost — the story stays `draft` and is resumable. Live-verified: wire carries `errorText:"hard_config"`, no model ID leak; server log has storyId/page/model/class/providerMessage.
- [ ] **Layer 3 flagged-path test — OPEN CAVEAT (documented, not worked around).** The Layer 3 canned-fallback path (unsafe *model output* → regenerate → canned page + `moderation_event`) cannot be exercised end-to-end with real components: Layer 1 blocks any input that would coax unsafe output, and a model failure is a *different* path (`onFinish` never runs). Owner ruling 2026-07-17: **no production test hook** (rejected — permanent scaffolding in safety-critical code to test one branch). Instead, drive the branch via a mocked moderation module once a route-handler test harness exists — see the test-suite item below. Until then the caveat stays open; an honest gap beats a hook that could ever leak a PASS.
- [ ] **Route-handler test harness (Layer 3 branch)** — vitest now exists (PR #12) with one pure-function suite (`classifyStreamError`). Next: a harness that can drive `POST /api/story/page` with `headers()`/session/db/`@/lib/moderation` mocked, then a test that forces `moderateOutput` → flagged and asserts the canned fallback + `moderation_event` row. Cost estimate to be re-quoted now that vitest is installed (first route-handler mock is the expensive part; subsequent ones are cheap). Owner decision pending.
- [ ] **`generation_error` durable log** — deferred by owner ruling (2026-07-17). Stream failures are logged to server stdout only (see stream-failure item above); a durable table is write-only until there's a reader. **Trigger to revisit: when PostHog (§12) lands** — `hard_config` failures are an ops signal (the app is misconfigured for every child, e.g. exhausted credits — the exact class that blocked the E2E for weeks), and PostHog is where that signal belongs. This is the concrete justification §12 previously lacked.
- [ ] **`description_embedding` (pgvector) on `character`** — still deferred (see Phase 2 schema bullet). Needs: pgvector extension confirmed on target Postgres, a separate `ALTER TABLE` migration, an embedding call on character upsert, and prompt-injection ranking by similarity instead of `appearance_count`. No owner decision yet on provider/dimensions (PRD assumed 1536).
- [ ] **PostHog (§12)** — still the only unchecked Phase 1 box. Now has a concrete first consumer: routing `hard_config` stream failures as an ops signal (see `generation_error` item).
- [ ] **Repo → plan reconciliation (full pass)** — NOT STARTED; queued after current threads close. The plan has twice turned out not to know what's in the repo (chat/diagnostics/old-`/dashboard`/DESIGN.md; then the Phase 3 badge/community slice). Do a full read-the-repo-then-correct-the-plan pass — repo is source of truth, plan follows. Do not correct the repo to match the plan.
