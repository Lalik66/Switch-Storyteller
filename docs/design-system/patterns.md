# Patterns

Patterns are composite arrangements — multi-component structures that appear repeatedly across the app and should be reused as-is. The landing page in [`src/app/page.tsx`](../../src/app/page.tsx) is the reference implementation for each of them.

For single primitives (buttons, cards, icons), see [`components.md`](./components.md).

---

## Grain overlay

The base texture of the entire app. Applied via a `.grain` class on `<body>` in [`src/app/layout.tsx`](../../src/app/layout.tsx).

```css
.grain::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.18;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.15 0 0 0 0 0.1 0 0 0 0 0.05 0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
.dark .grain::before {
  mix-blend-mode: screen;
  opacity: 0.08;
}
```

### Why pseudo-element?

Fixed position, `pointer-events: none`, sits above everything at `z-index: 1`. Content wraps inside `<div className="relative z-10">` so it sits above the grain without being affected. The grain is the visual difference between "a Tailwind page" and "a printed page."

**Do not remove it.** Do not replace with a solid color. Do not lower its opacity without testing in both themes.

---

## Section header

Every content section opens with the same rhythm:

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

Rules:

1. **Eyebrow first**, using `§` + roman numeral + separator + title.
2. **`mt-4`** between eyebrow and heading.
3. **Line break** in the heading — never a run-on sentence.
4. **One `italic-wonk` word or short phrase** as the accent.
5. **`mb-16`** below the header before content.

Optional: pair the header with a right-aligned description in a `md:flex-row` layout for the Worlds Atlas section.

---

## Hero pattern

Asymmetric 7/5 split. Large display heading on the left, decorative `card-stamp` on the right. See `Hero()` in [`src/app/page.tsx`](../../src/app/page.tsx).

### Structure

1. **Decorative layer** (absolute-positioned, `aria-hidden`):
   - Two constellation SVGs at `left-[6%] top-[12%]` and `right-[8%] top-[22%]`
   - A drifting gold ink swirl at `right-[-40px] top-[30%]`, `.drift` animation
2. **Left column (`lg:col-span-7`):**
   - Eyebrow with a tiny ember dot bullet
   - Huge display heading with clamp sizing
   - Body paragraph, `max-w-xl`
   - Button row: `.btn-ember` + `.btn-ghost-ink`
   - Proof row: three small shield/eye/feather icons
   - All children carry `.rise` with staggered `animationDelay` in 120ms steps
3. **Right column (`lg:col-span-5`):**
   - `ManuscriptCard` — a `.card-stamp` tilted `-1.5deg` with a gold backdrop card tilted `+3deg` behind it
   - Rotating wax seal floating outside the top-left

### Stagger timing

| Element | Delay |
|---|---|
| Eyebrow | `0ms` |
| Display heading | `120ms` |
| Body paragraph | `240ms` |
| Card (right column) | `300ms` |
| Button row | `360ms` |
| Proof row | `480ms` |

Always increment by 120ms so the reveal feels like a page opening, not a scatter.

---

## Manuscript card

The hero's right-column card. Represents a live story page so the visitor immediately understands the product.

### Layers

1. **Rotating seal** (absolute, `top-left: -10 -10`, outside the card):
   - 140×140 SVG with `textPath` tracing a circle — Fraunces italic 11px, letter-spaced `3`
   - Center: a small ember star
   - Animation: `.slow-spin` (30s linear infinite)
2. **Backdrop card** (absolute, inset 0, `-right-4 top-4`):
   - `rotate-[3deg]`, `bg-[color:var(--gold)]/30`, `border border-border`
3. **Front card** (`rotate-[-1.5deg]`, `.card-stamp p-7`):
   - Top row: `eyebrow` folio number + red "× live excerpt" label
   - Story paragraph in Newsreader with a gold-highlighted phrase and an italic ember "dialogue"
   - `.rule-ornament` with a star
   - `eyebrow` "What will Maren do?"
   - Three choice buttons
   - Bottom row: "or — write your own" + forest-dot "Safely reviewed" status

---

## Ticker (marquee)

Infinite horizontal scroll of italic story fragments, bordered top and bottom, fading at the edges.

```tsx
<div className="relative border-y border-border/60 bg-[color:var(--card)]/60 py-5 overflow-hidden">
  <div className="marquee">
    {[...fragments, ...fragments].map((f, i) => (
      <span key={i} className="flex-shrink-0 text-[1.4rem] italic leading-none text-foreground/55 font-[var(--font-newsreader)]">
        {f}
      </span>
    ))}
  </div>
  <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
  <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
</div>
```

### Rules

- **Duplicate the array** in the DOM (`[...fragments, ...fragments]`). The `.marquee` keyframe animates `translateX(0 → -50%)`.
- **Edge fades** at 24rem width using `from-background to-transparent` gradients on both sides.
- **Timing:** 48s linear infinite. Do not speed it up — the point is that it feels calm.
- Fragments are always italic Newsreader with an em-dash prefix.

---

## The Loop (3-step rhythm)

Three-column layout where each step has:

1. **Giant roman numeral** in `display-lg` at `text-[5.5rem]` in ember
2. **Decorative SVG icon** on the right, 48×48, stroke-only
3. **Gradient hairline** below — fades from 60% ember to transparent via `border`
4. **Heading** — `text-2xl`
5. **Body paragraph** — `max-w-sm text-[15.5px]`
6. **Connector arrow** (between steps) — dashed hand-drawn curve SVG, absolutely positioned

The connector is only visible at `md` and above. It breaks the grid intentionally, hanging off the right edge of each step.

---

## Story page preview

The canonical layout for an actual story page — what the app will serve the child after they pick an action. Reference: `SamplePage()` in `src/app/page.tsx`.

### Structure

1. **Card header**: avatar badge (ember circle with italic "M") + title + chapter eyebrow on the left, "page 5 / 10" eyebrow on the right. Border bottom.
2. **Body**: two Newsreader paragraphs at `text-[17px] leading-[1.85]`. One gold highlight and one italic ember dialogue per page.
3. **`.rule-ornament`** with a star.
4. **Choice prompt eyebrow**: "What does Maren do next?"
5. **Choice grid**: `md:grid-cols-3` of choice buttons (see [`components.md`](./components.md)).
6. **Footer row**: feather icon + "Or write your own" label on the left, `moderated ✓` mono label on the right.
7. **Bookmark ribbon**: absolute-positioned red rectangle with triangle cut-out at the bottom, on the right edge.

### Stats panel

On the left column, a 2-column `dl` with four stats:

| Value | Label |
|---|---|
| ~150 | words per page |
| 8–12 | pages per tale |
| 4 | safety layers |
| 0 | ads, ever |

Values use `display-lg text-4xl text-[color:var(--ember)]`, labels use `.eyebrow`. Each stat sits in a left-bordered column (`border-l border-border/70 pl-4`).

---

## Dark reading room section (Parents)

Full-bleed dark-ink section inside an otherwise light page, used for the Parents pillars. Creates a deliberate "night" moment that makes the trust messaging feel gravitas-heavy.

```tsx
<section className="relative border-y border-border/60 bg-[color:var(--ink)] py-32 text-[color:var(--parchment)]">
  …
</section>
```

### Rules

- **Background:** `bg-[color:var(--ink)]`
- **Body color:** `text-[color:var(--parchment)]`
- **Eyebrow color:** `text-[color:var(--gold)]` — swap from ember because ember against ink isn't distinctive enough
- **Heading accent:** gold instead of ember for the `italic-wonk` word
- **Pillars grid:** four items on a `bg-[color:var(--parchment)]/15` base, individual cells set back to `bg-[color:var(--ink)]` so the 1px gap between them reads as a warm hairline grid
- **Number style:** `font-mono text-xs text-[color:var(--gold)]` with `0` prefix ("01", "02", "03", "04")
- **Link underline:** `border-b border-[color:var(--gold)]/60 pb-1` for the "See our safety commitments" link

This is also the template for the future parent dashboard theme.

---

## Pricing ledger

Three `card-stamp` cards in a `md:grid-cols-3`. The middle (featured) tier lifts, scales, and glows:

```tsx
className={`card-stamp relative flex flex-col p-8 transition-all ${
  t.featured
    ? "md:-translate-y-4 md:scale-[1.02] border-[color:var(--ember)] shadow-[0_24px_60px_-30px_rgba(200,62,30,0.55)]"
    : ""
}`}
```

Featured adornments:

- Small ember pill stamp "Most chosen" absolute-positioned at `-top-3 left-1/2 -translate-x-1/2`
- Ember star SVG in the top-right of the card header
- Filled ember CTA button instead of ghost-style

Each card uses `.rule-ornament` between the description and the feature list.

---

## Final CTA

Full-width `.card-stamp` container with:

1. **Decorative dashed wave SVG** absolutely positioned, filling the background at 60% opacity in gold, `preserveAspectRatio="none"`
2. **Eyebrow** "Your tale awaits"
3. **Display XL heading** with `italic-wonk` accent, centered
4. **Body paragraph** with an italic quote
5. **Button row**: `.btn-ember` + `.btn-ghost-ink`

Sits above the footer with `pb-24 pt-8` for tighter rhythm than the main sections.
