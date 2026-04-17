# Icons & Ornaments

Every visual mark in the Illuminated Grimoire is **inline SVG**. There are no icon fonts, no raster images, no emojis used as UI. This keeps the system crisp, color-themable via `currentColor`, and free of network dependencies.

The system has two kinds of marks:

1. **Functional icons** — small UI marks like arrows, checks, eyes, shields. Inherit text color, sit inside buttons and links.
2. **Decorative ornaments** — constellations, wax seals, ink swirls, dividers, world scenes. Stand on their own, often animated, always `aria-hidden="true"`.

---

## Default icon attributes

```html
<svg
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="1.75"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <path d="M5 12h14M13 6l6 6-6 6" />
</svg>
```

### Rules

- **`viewBox="0 0 24 24"`** for functional icons unless documented otherwise.
- **`fill="none"`** + `stroke="currentColor"` for line icons; `fill="currentColor"` only for solid marks (stars, dots).
- **Stroke widths:**
  - `1.5` for subtle decorative icons (loop section icons, footer ornaments)
  - `1.75` for buttons, links, choice buttons, and most UI icons
  - `2` for strong checks (pricing tier feature lists)
- **Line caps and joins are always `round`.** Nothing in this system has square line ends.
- **Color via `currentColor`.** Never hardcode `#000` or hex. Always inherit from text color so the icon flips with the theme.

### Sizing

| Context | Size |
|---|---|
| Inline with body text | `width="14" height="14"` |
| Inside choice buttons | `width="14" height="14"` |
| Inside `.btn-ember` / `.btn-ghost-ink` | `width="18" height="18"` |
| Inside Loop section step icons | `width="48" height="48"` |
| Constellation ornaments | `className="h-28 w-28"` (responsive) |
| Wax seal monogram | `width="40" height="40"` |
| Rotating cursive seal | `className="h-28 w-28"` |

---

## Icon catalog

### Arrow (right)

The single most-used UI icon. Used on buttons, choice buttons, world tiles, and inline links.

```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path
    d="M5 12h14M13 6l6 6-6 6"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>
```

### Star (filled, 5-point)

For ornaments and decorative dividers.

```html
<svg width="14" height="14" viewBox="0 0 24 24">
  <path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="currentColor" />
</svg>
```

### Star (4-point sparkle)

Used inside `.rule-ornament` and the Sample Page divider.

```html
<svg width="16" height="16" viewBox="0 0 24 24">
  <path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" fill="currentColor" />
</svg>
```

### Check

For pricing tier feature lists. `strokeWidth="2"` for strength.

```html
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M20 6L9 17l-5-5" />
</svg>
```

### Shield, Eye, Feather (proof row)

Hero proof badges. `strokeWidth="1.5"`.

```ts
const paths = {
  shield:  "M12 3l8 3v6c0 4.5-3.4 8.5-8 9-4.6-.5-8-4.5-8-9V6l8-3z",
  eye:     "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z",
  feather: "M20 4a6 6 0 00-8 0L5 11v7h7l7-7a6 6 0 000-7zM5 18l5-5",
};
```

Wrap in a 14×14 SVG with `text-[color:var(--ember)]` so they read as warm trust signals, not cold security badges.

### Loop section step icons

Three large abstract marks (star, compass, book), 48×48, `strokeWidth="1.2"`, `text-foreground/35`. They are intentionally low-contrast and abstract — the roman numerals carry the semantics, the icons carry the atmosphere.

```ts
const icons = [
  // Star
  "M12 2l2.2 6.8H22l-6 4.4 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.4h7.8z",
  // Compass / world
  "M12 3a9 9 0 100 18 9 9 0 000-18zm0 0v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4",
  // Book
  "M4 4h10a4 4 0 014 4v12H8a4 4 0 01-4-4V4zM4 4v12a4 4 0 004 4M14 4v16",
];
```

---

## Decorative ornaments

These are the moments of delight. Each appears at most a few times across the site — they earn their power from rarity.

### Wax-seal monogram (header logo)

40×40 SVG. Solid ember circle, dashed inner stroke, italic Fraunces "H" centered. See [`src/components/site-header.tsx`](../../src/components/site-header.tsx).

```html
<svg viewBox="0 0 40 40" className="h-10 w-10 text-[color:var(--ember)]">
  <circle cx="20" cy="20" r="17" fill="currentColor" />
  <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.35)" strokeDasharray="2 3" />
  <text x="20" y="26" textAnchor="middle" fontFamily="var(--font-fraunces), Georgia, serif" fontSize="18" fontStyle="italic" fill="#fff" fontWeight="500">
    H
  </text>
</svg>
```

Hovers `-rotate-6` over 500ms. The white-text-on-ember pairing is the only place in the system where pure white is allowed, because it represents wax embossing.

### Rotating cursive seal

140×140 SVG with `textPath` tracing a circle. Fraunces italic 11px, letter-spaced 3. Used once, on the hero manuscript card.

```html
<svg viewBox="0 0 140 140" className="h-28 w-28 text-[color:var(--ink)] slow-spin">
  <defs>
    <path id="circle" d="M70,70 m-54,0 a54,54 0 1,1 108,0 a54,54 0 1,1 -108,0" />
  </defs>
  <text fontFamily="var(--font-fraunces), Georgia, serif" fontSize="11" letterSpacing="3" fill="currentColor" fontStyle="italic">
    <textPath href="#circle">
      · Chapter One · The door is open · Chapter One ·
    </textPath>
  </text>
</svg>
```

Center holds a 26×26 ember 5-point star.

### Constellation

Small inline SVG of 5–6 twinkling stars connected by dashed lines. Two variants (`a` and `b`) defined inline in `src/app/page.tsx`.

```html
<svg viewBox="0 0 100 100" className="h-28 w-28 text-[color:var(--ember)]/55" aria-hidden="true">
  <g>
    {points.map(([x, y], i) => (
      <circle cx={x} cy={y} r="1" fill="currentColor" className="twinkle" style={{ animationDelay: `${i * 0.4}s` }} />
    ))}
    <path d={`M${points.map(p => p.join(",")).join(" L ")}`} fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 2" />
  </g>
</svg>
```

Use anywhere you need subtle visual interest without pulling focus. Stagger twinkle delays in 0.4s steps.

### Drifting ink swirl

Decorative gold loop in the hero, abstract calligraphic stroke. 200×200 viewBox, `.drift` animation.

```html
<svg viewBox="0 0 200 200" className="absolute right-[-40px] top-[30%] hidden w-[260px] text-[color:var(--gold)] opacity-60 md:block drift">
  <path
    d="M20 100 C 20 40, 80 20, 120 60 S 180 160, 100 180 S 20 140, 60 100 S 140 90, 140 130"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
  />
</svg>
```

### Footer divider ornament

Hand-drawn S-curve straddling the top border of the footer, with a hollow dot center and two end caps.

```html
<svg width="120" height="36" viewBox="0 0 120 36" fill="none" className="text-[color:var(--ember)]">
  <path d="M2 18 C 20 18, 30 6, 50 18 S 80 30, 98 18" stroke="currentColor" strokeWidth="1.25" fill="none" />
  <circle cx="60" cy="18" r="6" fill="var(--background)" stroke="currentColor" strokeWidth="1.25" />
  <circle cx="60" cy="18" r="2" fill="currentColor" />
  <circle cx="12" cy="18" r="1.5" fill="currentColor" />
  <circle cx="108" cy="18" r="1.5" fill="currentColor" />
</svg>
```

### Loop connector arrow

Dashed hand-drawn curve with a small chevron, used to connect the three steps in The Loop section.

```html
<svg width="40" height="24" viewBox="0 0 40 24" className="text-[color:var(--ember)]/40">
  <path d="M2 12 C 10 2, 18 22, 28 12" stroke="currentColor" strokeWidth="1.25" fill="none" strokeDasharray="2 3" />
  <path d="M28 12 L 24 9 M28 12 L 24 15" stroke="currentColor" strokeWidth="1.25" fill="none" strokeLinecap="round" />
</svg>
```

### Final CTA dashed waves

Background ornament for the Final CTA card. Two parallel dashed S-curves spanning the full width with `preserveAspectRatio="none"`.

```html
<svg viewBox="0 0 400 200" preserveAspectRatio="none" className="h-full w-full text-[color:var(--gold)]">
  <path d="M0 100 C 80 40, 160 160, 240 90 S 380 130, 400 80" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 4" />
  <path d="M0 130 C 80 80, 160 200, 240 120 S 380 160, 400 110" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 5" />
</svg>
```

---

## World tile illustrations

Each of the six worlds in the Atlas has a custom inline SVG scene at `viewBox="0 0 100 100"` with `preserveAspectRatio="xMidYMid slice"`. They are intentionally minimal — silhouettes, geometric primitives, gold accents — so they read at any size and inherit each world's tone color via `currentColor`.

| World | Scene description |
|---|---|
| The Moonlit Forest | Tree silhouettes against a gold moon |
| The Clockwork City | Concentric clock face with hour ticks and hands |
| The Sunken Kingdom | Layered waves, tiny gold fish, a small castle silhouette |
| The Dragon's Spine | Mountain range silhouette with an ember sun |
| The Stardust Bazaar | Tent silhouettes with twinkling gold stars |
| The Hollow Meadows | Rolling hills with tiny mushroom dots |

When the real world manifest lands in `src/lib/worlds.ts`, these inline scenes will be replaced with proper artist-drawn assets — but the system contract stays: `viewBox="0 0 100 100"`, `currentColor`, gold accent color, no raster.

---

## Don'ts

- ❌ No icon fonts (Font Awesome, Material Icons, Heroicons via font).
- ❌ No emojis (🔥, ✨, 📚) anywhere in the UI. They cannot be themed and they fight the aesthetic.
- ❌ No PNG/JPG icons. Only SVG.
- ❌ No hardcoded fill or stroke colors except for the wax-seal monogram (which uses white-on-ember intentionally) and the world tile gold accents.
- ❌ No square line caps. Round only.
- ❌ No icon-only buttons without an `aria-label`.
