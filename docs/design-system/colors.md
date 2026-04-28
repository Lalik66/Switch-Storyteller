# Colors

**Source of truth:** [`src/app/globals.css`](../../src/app/globals.css). Values below mirror `:root` and `.dark` there; if they disagree, the CSS file wins.

> **Locked palette (2026-04-28).** The two modes below are canonical and must not be retuned without explicit owner approval — see the `DESIGN TOKENS — LOCKED` header in `globals.css` and the rule in [`/CLAUDE.md`](../../CLAUDE.md).

Hero's Forge ships **two coherent modes** keyed off `class="dark"` on `<html>`:

- **Light mode** — warm **parchment** surface (`--parchment` cream) with deep **ink** text and **ember** orange accents. Reads like an illustrated children's folio.
- **Dark mode** — deep **cosmic navy** surface (`--parchment` resolves to a near-midnight blue-violet) with cream **starlight** text (`--ink`), the same **ember** firelight accents, and a soft golden radial glow.

Both modes share the brand tokens `--ember`, `--gold`, `--forest`, `--dusk` (with mode-specific OKLCH lightness so contrast stays legible in either). `--gold` is a distinct warm yellow, **not** an alias of ember.

---

## Brand tokens

| Token | Role | Light-mode value | Dark-mode value | Notes |
|---|---|---|---|---|
| `--parchment` | Page surface base | `oklch(0.948 0.028 82)` cream | `oklch(0.135 0.035 268)` cosmic navy | Drives `--background` in both modes. |
| `--ink` | Default text | `oklch(0.18 0.02 45)` deep ink | `oklch(0.95 0.025 85)` cream starlight | Drives `--foreground`. |
| `--ember` | Brand orange accent | `oklch(0.58 0.178 35)` | `oklch(0.68 0.18 38)` | Hero word, CTAs (`.btn-ember`), H mark, live badge, `var(--ember)` in UI. |
| `--gold` | Highlight / chart-2 | `oklch(0.76 0.128 80)` | `oklch(0.82 0.13 82)` | Distinct warm yellow — used for `--accent`, world tiles, eyebrow ornaments. |
| `--forest` | World / success green | `oklch(0.42 0.072 155)` | `oklch(0.62 0.09 158)` | World tiles, status, "safely reviewed" dot. |
| `--dusk` | World purple | `oklch(0.4 0.082 325)` | `oklch(0.6 0.1 305)` | Space / bazaar worlds. |

`@theme inline` exposes `--color-parchment`, `--color-ink`, `--color-ember`, `--color-gold`, `--color-forest`, `--color-dusk` and the semantic shadcn names below for Tailwind-style usage.

---

## Semantic tokens (shadcn)

Surfaced via `@theme inline` so utilities like `bg-background`, `text-foreground` work.

| Token | Resolves to (concept) | Use |
|---|---|---|
| `--background` | `var(--parchment)` | Body — cream in light, cosmic navy in dark |
| `--foreground` | `var(--ink)` | Body text — deep ink in light, starlight cream in dark |
| `--card` / `--popover` | OKLCH parchment-tinted (light) or navy-tinted (dark) surfaces | Cards, popovers |
| `--primary` | `var(--ember)` | Main CTA / ring color (`.btn-ember`) — orange in both modes |
| `--primary-foreground` | Near-cream | Text on `--primary` surfaces |
| `--accent` | `var(--gold)` | Accent surfaces; pairs with `--accent-foreground` |
| `--ring` | `var(--ember)` | Focus rings |
| `--chart-1` … `--chart-5` | ember, gold, forest, dusk, +1 | Charts |

The CTA class `.btn-ember` in CSS is now correctly an **ember-orange** pill (token `--primary` resolves to `var(--ember)`).

---

## Usage rules

### Ember (orange)

- Primary CTA fill (`.btn-ember`), focus ring (`--ring`), `--primary` token.
- One **hero** accent word per section via `.italic-wonk text-[color:var(--ember)]` or `.heading-gold`.
- Small UI: language switcher active state, header monogram, manuscript "live" line, eyebrow dot.
- Do not flood the viewport — keep orange for emphasis and navigation affordances.

### Gold

- Warm yellow highlight: `--accent`, world-tile washes (`color-mix(in oklch, var(--gold) 14%, var(--card))`), parchment ornaments. Distinct from ember — never substitute one for the other.

### Forest / dusk

- Use for **world identity**, choice tiles, and green/purple status — not as a second orange.

### `color-mix`

Prefer `color-mix(in oklch, var(--foreground) N%, transparent)` (and similar) for borders and shadows so both themes stay coherent.

```css
border: 1px solid color-mix(in oklch, var(--foreground) 10%, transparent);
```

---

## Contrast

Re-check any new pair with an OKLCH or APCA tool. **Ember** on `--background` (both modes) and **ink/starlight** on `--card` are the main interactive pairings to validate. Tokens are locked — these checks only matter if you propose a change *and* get owner approval.

---

See [`dark-mode.md`](./dark-mode.md) for `class="dark"` on `<html>`, `ThemeProvider`, and how the same brand-token names (`--parchment`, `--ink`, `--ember`, `--gold`, `--forest`, `--dusk`) take different OKLCH values under `.dark`.
