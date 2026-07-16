# Design constraints

Standing decisions that code must respect. Add entries here when a
constraint is easy to violate accidentally and expensive to rediscover.

## Email — Resend sending domain

**The Resend-verified sending domain is the subdomain `mail.herosforge.app`,
NOT the apex `herosforge.app`.** Verified 2026-07-16 (eu-west-1, sending
only). Any `from:` address on the bare apex — e.g. `auth@herosforge.app` —
is rejected by the Resend API with a 403 `validation_error`.

All senders must use `<name>@mail.herosforge.app`:

- Auth emails: `auth@mail.herosforge.app` (`src/lib/auth.ts`)
- Parent digest: `digest@mail.herosforge.app` (`src/app/api/cron/parent-digest/route.ts`)

If a new sender identity is added, keep it on `mail.herosforge.app` — or
verify the new domain in Resend first (https://resend.com/domains) and
update this note.

## Design tokens (see CLAUDE.md)

The OKLCH palette in `src/app/globals.css` is frozen as of 2026-04-28 —
the locked block is delimited by the "DESIGN TOKENS — LOCKED" comment.
Restyling requires the owner's written approval.
