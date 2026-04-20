# Hero's Forge — Feature Requirements

**Spec version:** 1.0  
**Authoritative product doc:** [`docs/prd/heros-forge.md`](../../docs/prd/heros-forge.md) (PRD v1.1)

## Summary

Hero's Forge is an AI-assisted collaborative storytelling web app for children **7–12**, built on the Switchh stack (Next.js 16, Better Auth, Drizzle/Postgres, OpenRouter, OpenAI moderation, Vercel Blob or local storage). Parents own billable accounts; **child profiles** are sub-profiles under a parent user.

## Goals

1. Prove the **AI + child co-authorship loop** (Phase 1): intake → world pick → streamed story pages with choices → progress → PDF export, with **moderation** on inputs and outputs.
2. Grow the product in **Phase 2** (illustrations, character memory, PWA polish, parent digest email, audio).
3. Add **community, print, badges, and subscriptions** in **Phase 3**.

## Non-goals (Phase 1)

- AI-generated scene images (Phase 2).
- Community feed, remix, Stripe, Lulu print (Phase 2/3).
- Native mobile apps (PWA only when Phase 2 PWA work ships).

## Personas

| Persona | Needs |
|--------|--------|
| **Child** | Simple, safe, fun story flow; clear actions; readable text. |
| **Parent** | Trust, controls, visibility into what the child wrote (full text, not vague summaries). |
| **Operator** | Moderation events, safety metrics (admin tooling deferred past minimal Phase 1). |

## Functional requirements (by phase)

### Phase 1 — The Story Loop (MVP)

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| P1-1 | **Drafting Buddy** — multi-step intake (hero, world, problem) | Parent session; valid inputs; creates `story` row in `draft` state. |
| P1-2 | **World selection** from static manifest | Tiles from `src/lib/worlds.ts`; assets under `public/worlds/`; invalid `world_key` rejected. |
| P1-3 | **Interactive pages** | API streams ~150-word page + 3 actions + free-text custom action; persists `story_page` rows. |
| P1-4 | **Progress** | Word count / page count / chapter count surfaced on story UI; stored on `story` / pages as in schema. |
| P1-5 | **Safety v1** | Pre-prompt and post-output moderation via OpenAI `omni-moderation-latest`; guardrails in `story-prompts.ts`; logging to `prompt_log` / `moderation_event` per design. |
| P1-6 | **PDF export** | Authenticated download of a generated PDF for a story (route under `src/app/api/story/[id]/pdf/`). |
| P1-7 | **Child profiles** | Parent can create/edit child profiles (`child_profile`); settings fields align with PRD §7. |
| P1-8 | **Free tier throttle** | At most **one new story per rolling 7 days** per free-tier child (PRD §11); enforced in story creation API. |

### Phase 2 — The World Grows

| ID | Requirement | Notes (PRD §4.2) |
|----|-------------|------------------|
| P2-1 | Selective **image generation** (e.g. 5 images / 8 pages), OpenRouter image models, `story_image` + `scene_hash` cache | Route `src/app/api/story/[id]/images/route.ts` |
| P2-2 | **Character vault** + embeddings (`character`, pgvector) | Prompt injection for consistency |
| P2-3 | **PWA** — manifest + service worker, installable | Replace boilerplate manifest branding |
| P2-4 | **Parent dashboard** + **weekly digest** | `src/app/(parent)/dashboard/page.tsx`, cron, Resend, React Email |
| P2-5 | **ElevenLabs TTS** | `src/app/api/story/[id]/audio/route.ts`, cache in Blob |

### Phase 3 — The Community

| ID | Requirement | Notes (PRD §4.3) |
|----|-------------|------------------|
| P3-1 | **Remix** | `parent_story_id` on `story`; clone pages 1–4 |
| P3-2 | **Community feed** | `src/app/community/page.tsx`; gated by moderation + `allow_publish` |
| P3-3 | **Print-on-demand** | Lulu xPress, `src/app/api/print/route.ts` |
| P3-4 | **Badges** | `badge` / `child_badge` tables |
| P3-5 | **Pro subscription** | Stripe (Better Auth plugin or `lib/billing`) |

## Current implementation status (snapshot)

The codebase **already implements most of Phase 1** (domain schema, worlds, moderation, story APIs, reader UI, PDF route, children management, weekly story rate limit). Gaps vs PRD are tracked in [`implementation-plan.md`](./implementation-plan.md) (verification, parent verbatim visibility polish, and later phases).

The PRD’s opening “no domain tables” note is **out of date** — `src/lib/schema.ts` now includes Hero's Forge Phase 1 tables.

## Dependencies

- Postgres, Better Auth, OpenRouter, OpenAI moderation key, optional Vercel Blob — see [`action-required.md`](./action-required.md).

## References

- Design system: `docs/design-system/`
- Env mapping: `src/lib/env.ts`, `env.example`
