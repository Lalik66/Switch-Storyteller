# Spacing & Layout

The Illuminated Grimoire is an editorial system. Layouts are built on a responsive 12-column grid but break out of it deliberately with tilted cards, ornaments crossing gutters, and roman numerals busting baselines. The goal is *intentional* asymmetry, never accidental misalignment.

---

## Container & section rhythm

```tsx
<section className="container mx-auto px-6 py-32">…</section>
```

- **Container:** `container mx-auto px-6` (Tailwind default max-widths: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`).
- **Horizontal padding:** `px-6` minimum on every section. Never flush to the viewport edge.
- **Vertical rhythm:** major sections use `py-24` to `py-32`. The final CTA uses `pb-24 pt-8` to sit tighter against the footer.

### Section header template

```tsx
<header className="mb-16 max-w-2xl">
  <p className="eyebrow">&sect; III &middot; A page from the tale</p>
  <h2 className="display-lg mt-4 text-5xl md:text-6xl">
    Gentle words,
    <br />
    <span className="italic-wonk">great choices.</span>
  </h2>
</header>
```

The `mb-16` below a section header is the canonical rhythm — anything tighter feels cramped, anything looser breaks the grimoire density.

---

## Grid: 12-column asymmetric

Editorial sections default to 12 columns with **asymmetric** splits. Never 6/6.

```tsx
<div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
  <div className="lg:col-span-7">…copy…</div>
  <div className="lg:col-span-5">…card…</div>
</div>
```

### Approved splits

| Split | When to use |
|---|---|
| `7 / 5` | Hero copy on the left, decorative card on the right |
| `5 / 7` | Small intro copy, large visual (Sample Page, Parents pillars) |
| `5 / 7` | Pillar grid next to intro copy |

### Forbidden splits

- `6 / 6` — feels generic and corporate
- `4 / 8` or `8 / 4` — too lopsided, kills the balance

---

## Asymmetry & tilts

Tiny intentional rotations are what make the design feel hand-set.

| Element | Rotation |
|---|---|
| Hero manuscript card | `rotate-[-1.5deg]` |
| Tilted backdrop card (gold, behind hero card) | `rotate-[3deg]` |
| `.btn-ember` on hover | `rotate-[-0.4deg]` + `translateY(-2px)` |
| Wax-seal monogram on hover | `-rotate-6` (500ms) |

**Rule of thumb:** rotations between `±0.5deg` and `±3deg`. Anything larger reads as broken.

### Breaking the grid

Roman numerals, constellations, and ornaments routinely cross their column boundaries:

- Roman numerals in The Loop are `text-[5.5rem]` and hang off the baseline into the next section.
- Constellations and the drift swirl use `absolute` positioning with percentage offsets.
- The Final CTA's dashed wave paths use `preserveAspectRatio="none"` and stretch the full width behind the text.

---

## Radius

```css
:root {
  --radius: 0.375rem;
}
```

Tight, letterpress-like. Cards, buttons, and inputs all share the same base.

| Shape | Radius |
|---|---|
| Cards (`.card-stamp`) | `var(--radius)` |
| Choice buttons | `rounded-sm` (~2px) |
| Primary CTA (`.btn-ember`) | `999px` (full pill) |
| Ghost CTA (`.btn-ghost-ink`) | `999px` |
| Folio number badges | `999px` |
| World tile badges | `999px` |
| Avatar circles | `999px` |
| Section wrappers | `rounded-lg` or `rounded-[var(--radius)]` |

The small tight radius on cards (`0.375rem`) paired with the pill radius on buttons is a deliberate contrast — the cards feel like paper, the buttons feel like wax seals.

---

## Borders

Warm sepia, always `1px`. Cards draw borders **twice** (outer + inner via `::after`) for the folio look:

```css
.card-stamp {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.card-stamp::after {
  content: "";
  position: absolute;
  inset: 3px;
  border: 1px solid color-mix(in oklch, var(--foreground) 10%, transparent);
  border-radius: calc(var(--radius) - 2px);
  pointer-events: none;
}
```

For subtle dividers, prefer `border-border/60` or `border-border/50` (warm sepia at reduced opacity) over solid lines.

---

## Shadow

All shadows are **warm and soft**. The canonical card shadow:

```css
box-shadow:
  0 1px 0 color-mix(in oklch, var(--foreground) 8%, transparent),
  0 14px 30px -18px color-mix(in oklch, var(--foreground) 30%, transparent);
```

Two layers:

1. A hairline bottom edge (`0 1px 0`) — simulates the top of a folio lifted slightly off the page.
2. A soft warm drop (`0 14px 30px -18px`) — the card’s shadow on the “table” (canvas) beneath.

### Featured pricing tier

The featured tier adds an ember glow:

```css
box-shadow: 0 24px 60px -30px rgba(200, 62, 30, 0.55);
```

Keep this rare — glows are special moments.

### Buttons

`.btn-ember` uses inset highlights rather than drop shadows:

```css
box-shadow:
  inset 0 1px 0 color-mix(in oklch, white 35%, transparent),
  inset 0 -2px 0 color-mix(in oklch, black 25%, transparent),
  0 10px 24px -12px color-mix(in oklch, var(--ember) 80%, transparent);
```

The inset top highlight + inset bottom shadow read as a pressed wax seal.

---

## Background atmosphere

Applied globally in `@layer base`:

```css
body {
  background-image:
    radial-gradient(
      ellipse 80% 60% at 20% 0%,
      color-mix(in oklch, var(--gold) 18%, transparent) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse 70% 50% at 100% 30%,
      color-mix(in oklch, var(--ember) 10%, transparent) 0%,
      transparent 55%
    );
  background-attachment: fixed;
}
```

Two fixed radial gradients — gold glow top-left, ember glow upper-right. Gives the page warmth without any decorative imagery. **Never replace with a solid color.**

Combined with the `.grain::before` overlay (see [`patterns.md`](./patterns.md)), this is the reason the page does not look like default Tailwind.

---

## Spacing primitives

When in doubt, prefer these Tailwind steps:

| Token | Use |
|---|---|
| `gap-2` | Icon + label pairs, choice button content |
| `gap-3` | Avatar + text |
| `gap-4` | Button groups |
| `gap-6` | Grid items (dense) |
| `gap-8` | Grid items (standard) |
| `gap-12` | Hero split panels |
| `space-y-2.5` | Choice button stacks |
| `space-y-3` | Footer link lists |
| `mt-4` | Eyebrow → heading spacing |
| `mt-6` | Heading → body spacing |
| `mt-10` | Body → CTA spacing |
| `mb-16` | Section header → content spacing |
| `py-24` / `py-32` | Section vertical rhythm |

Stay on this scale. Do not introduce ad-hoc `mt-7` or `py-28` values — they break visual rhythm.
