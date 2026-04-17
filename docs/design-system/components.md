# Components

All reusable primitives live as utility classes in [`src/app/globals.css`](../../src/app/globals.css) under `@layer components`, and compose with Tailwind. This document covers every component on the landing page plus the core interaction primitives that will carry into the app proper.

Larger, multi-part arrangements (hero, sample page, parents section) are documented in [`patterns.md`](./patterns.md).

---

## `.btn-ember` — Primary wax-seal button

```html
<a href="#worlds" class="btn-ember">
  Begin a tale
  <svg>…arrow…</svg>
</a>
```

Pill-shaped, ember-filled, with inset highlights (top white 35%, bottom black 25%) that read as a pressed wax seal. Hover lifts 2px and rotates `-0.4deg`.

```css
.btn-ember {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.9rem 1.6rem;
  background: var(--ember);
  color: var(--primary-foreground);
  border-radius: 999px;
  font-family: var(--font-fraunces), Georgia, serif;
  font-weight: 500;
  box-shadow:
    inset 0 1px 0 color-mix(in oklch, white 35%, transparent),
    inset 0 -2px 0 color-mix(in oklch, black 25%, transparent),
    0 10px 24px -12px color-mix(in oklch, var(--ember) 80%, transparent);
  transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s;
}
```

### Rules

- **At most two instances per viewport.** Typically one in the hero, one in the final CTA. Overuse kills the seal metaphor.
- **Always pair with a trailing arrow SVG.** Never text-only.
- **Always pair with `.btn-ghost-ink`** as the secondary action — they are designed as a pair, not alone.

---

## `.btn-ghost-ink` — Secondary button

```html
<a href="#parents" class="btn-ghost-ink">For parents</a>
```

Transparent pill, 25%-ink border, hover fills to `foreground/6%` and deepens the border. Lifts 1px on hover. Stands only alongside `.btn-ember`.

---

## `.card-stamp` — Sealed folio card

```html
<article class="card-stamp p-7">…</article>
```

The core surface of the system. A card with a 1px border plus an inset `::after` border 3px inside, warm shadow, subtle depth.

```css
.card-stamp {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow:
    0 1px 0 color-mix(in oklch, var(--foreground) 8%, transparent),
    0 14px 30px -18px color-mix(in oklch, var(--foreground) 30%, transparent);
  position: relative;
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

### Uses

- Hero manuscript card (tilted `-1.5deg`)
- Worlds Atlas tiles
- Sample page preview
- Pricing tiers
- Final CTA container

### Variations

- **Tilt** (`rotate-[-1.5deg]`) for hand-placed feel.
- **Backdrop double-up:** add a second gold-tinted card behind and offset, rotated `+3deg`, to create depth.
- **Featured:** swap border to `border-[color:var(--ember)]` and add an ember glow shadow for the highlighted pricing tier.

---

## `.eyebrow` — Section label

```html
<p class="eyebrow">&sect; II &middot; The atlas</p>
```

Uppercase JetBrains Mono at `0.72rem`, letter-spaced `0.22em`, foreground at 60%. Use before every section heading, on tiny metadata, and as the footer signature.

Override tracking when needed: `class="eyebrow !tracking-[0.18em]"`.

---

## `.rule-ornament` — Hand-drawn divider

```html
<div class="rule-ornament my-6">
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" fill="currentColor" />
  </svg>
</div>
```

Two fading hairlines flanking a small SVG ornament (star, diamond, dot, or circle). Used inside cards to separate narrative from controls — see the Hero manuscript card and Sample Page preview.

---

## Choice button — Story action primitive

The single most important component for the real app. Used wherever a child picks between action choices (a/b/c) or a custom action.

```html
<button
  type="button"
  class="group flex w-full items-center justify-between rounded-sm border border-border/80 bg-background/60 px-3 py-2.5 text-left text-[14px] text-foreground/85 transition-all hover:-translate-y-[1px] hover:border-[color:var(--ember)] hover:bg-[color:var(--gold)]/20"
>
  <span class="flex items-center gap-3">
    <span class="grid h-5 w-5 place-items-center rounded-full border border-border text-[10px] font-medium text-foreground/60 group-hover:border-[color:var(--ember)] group-hover:text-[color:var(--ember)]">
      a
    </span>
    Kneel and whisper back
  </span>
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    class="text-foreground/30 transition-all group-hover:translate-x-1 group-hover:text-[color:var(--ember)]"
  >
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
</button>
```

### Anatomy

1. **Circular letter (a/b/c)** — 20px (`h-5 w-5`) or 24px (`h-6 w-6`) depending on density. Border picks up ember on hover.
2. **Label** — Newsreader body at `text-[14px]` or `text-sm`.
3. **Trailing arrow** — animates `translate-x-1` and turns ember on hover.

### Hover feedback

- Card lifts 1–2px (`-translate-y-[1px]`)
- Border color transitions to ember
- Background warms to `gold/20`
- Arrow slides right and turns ember
- Circular letter border and text turn ember

When this becomes a real React component, name it `StoryChoiceButton` and expose props for `letter`, `label`, `onClick`, `disabled`.

---

## World tile

Card composition used in the Worlds Atlas. Each tile has:

1. **Illustration area** — `aspect-[4/3]` wrapper containing an inline SVG scene. Background uses `color-mix(in oklch, <worldTone> 14%, var(--card))`. SVG scales to `1.06` on hover over 1.2s.
2. **Folio number badge** — small pill with JetBrains Mono uppercase "No. 01", positioned `top-4 left-4`, blurred backdrop.
3. **Label strip** — card title + `.eyebrow` tagline on the left, arrow on the right. Arrow animates like the choice button.

```html
<article class="group card-stamp relative overflow-hidden p-0 transition-all duration-500 hover:-translate-y-1">
  <div class="relative aspect-[4/3] w-full overflow-hidden" style="color: var(--forest); background: color-mix(in oklch, var(--forest) 14%, var(--card));">
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" class="absolute inset-0 h-full w-full transition-transform duration-[1.2s] group-hover:scale-[1.06]">
      <!-- scene -->
    </svg>
    <span class="absolute left-4 top-4 rounded-full border border-foreground/15 bg-background/70 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground/70 backdrop-blur">
      No. 01
    </span>
  </div>
  <div class="flex items-baseline justify-between gap-4 px-5 py-4">
    <div>
      <h3 class="text-xl leading-tight text-foreground">The Moonlit Forest</h3>
      <p class="eyebrow mt-1 !tracking-[0.18em]">Whisper-magic</p>
    </div>
    <svg>…arrow…</svg>
  </div>
</article>
```

Each of the six worlds has its own tone color — see [`colors.md`](./colors.md).

---

## Site header

Defined in [`src/components/site-header.tsx`](../../src/components/site-header.tsx).

### Anatomy

1. **Wax-seal monogram** — 40×40 SVG circle filled with `--ember`, dashed inner stroke, italic Fraunces "H". Hover rotates `-6deg` over 500ms.
2. **Wordmark block** — `.eyebrow` "Est. MMXXVI" above the Fraunces wordmark "The Hero's *Forge*".
3. **Nav links** — simple text links with `text-foreground/75 hover:text-foreground` transitions. Hidden below `md`.
4. **Action group** — `ModeToggle` + `UserProfile`, always visible.

Includes a "Skip to main content" link that becomes visible on focus.

---

## Site footer

Defined in [`src/components/site-footer.tsx`](../../src/components/site-footer.tsx).

### Anatomy

1. **Top ornament** — hand-drawn SVG curve with a central dot, absolutely positioned straddling the top border.
2. **Brand column** — Fraunces wordmark + tagline + signature eyebrow.
3. **Link columns** — three columns ("The Tale", "For Grown-ups", "The Scribes") using a shared `FooterCol` sub-component.
4. **Bottom bar** — copyright + "Bound in parchment · Printed with ember" eyebrow.

Hover state on links: transition to `text-[color:var(--ember)]`.

---

## Iconography

All icons are inline SVG — **never** emoji, **never** an icon font, **never** a raster image. See [`icons.md`](./icons.md) for the catalog of decorative SVGs (constellations, seals, arrows, ornaments).

Icon defaults:

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

- **Stroke weight:** `1.5` for subtle icons, `1.75` for buttons, `2` for high-contrast checks.
- **Line caps / joins:** always `round`. Nothing in this system has square line ends.
- **Color:** always `currentColor` so icons inherit from parent text.

---

## Forms & inputs (planned)

The shadcn primitives (`Input`, `Textarea`, `Label`, radio groups) still need to be restyled to match this system. When that lands:

- Border: `1px solid var(--input)`, warm sepia
- Background: `var(--card)` (slightly lighter parchment)
- Font: Newsreader body
- Labels: Fraunces at 14–15px, not uppercase
- Focus ring: `2px var(--ring)` (ember) with `2px` offset against parchment
- Placeholder: `text-foreground/40` in italic Newsreader

Document them here once built. See [`overview.md`](./overview.md) roadmap item #1.
