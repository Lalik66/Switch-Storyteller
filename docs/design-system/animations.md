# Animations

Motion in the Illuminated Grimoire is **calm and intentional**. Nothing bounces, nothing pulses fast, nothing flies in from off-screen at speed. Every animation is meant to feel like the page is breathing — pages turning, candles flickering, stars twinkling — never like a UI demanding attention.

All animation utilities are defined in [`src/app/globals.css`](../../src/app/globals.css) under `@layer components`.

---

## The five motion primitives

| Class | Behavior | Duration | Use |
|---|---|---|---|
| `.rise` | Fade in + 14px translateY | 0.9s ease-out (`both` fill) | Hero element reveal on load |
| `.drift` | Float up/down + slight rotate | 9s ease-in-out infinite | Decorative ornaments (ink swirls) |
| `.twinkle` | Opacity + scale pulse | 3.5s ease-in-out infinite | Constellation stars |
| `.slow-spin` | Full 360° rotation | 30s linear infinite | Rotating wax seal |
| `.marquee` | Horizontal infinite scroll | 48s linear infinite | Story-fragment ticker |

### Keyframes

```css
@keyframes rise-in {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes drift {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-8px) rotate(1.5deg); }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.15); }
}

@keyframes slow-spin {
  to { transform: rotate(360deg); }
}

@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

---

## Stagger pattern (hero reveal)

The single most important on-load animation. Six elements rise sequentially in 120ms steps so the page feels like a book opening.

```tsx
<p className="eyebrow rise" style={{ animationDelay: "0ms" }}>…</p>
<h1 className="display-xl rise" style={{ animationDelay: "120ms" }}>…</h1>
<p className="rise" style={{ animationDelay: "240ms" }}>…</p>
<ManuscriptCard className="rise" style={{ animationDelay: "300ms" }} />
<div className="rise" style={{ animationDelay: "360ms" }}>…buttons…</div>
<div className="rise" style={{ animationDelay: "480ms" }}>…proof row…</div>
```

### Rules

- **Always 120ms steps.** Faster feels chaotic, slower feels broken.
- **The visual right column lands earlier** (300ms) than the buttons below it (360ms). This pulls the eye across the page in the right reading order.
- **Use `both` fill mode** (already in the keyframe) so elements stay visible after the animation completes.
- **Apply `.rise` only on initial page load.** Do not retrigger on scroll.

---

## Decorative loops

These run forever and live on `aria-hidden="true"` SVG elements. They must never compete with content for attention.

### `.drift` — Floating ornaments

```html
<svg className="drift" aria-hidden="true">…ink swirl…</svg>
```

Used on the gold ink swirl in the hero. 9-second cycle, 8px vertical travel, 1.5° rotate. Slow enough to be subliminal.

### `.twinkle` — Constellation stars

```html
<circle className="twinkle" style={{ animationDelay: "1.2s" }} />
```

Used on each star inside `Constellation` SVGs and on the Stardust Bazaar world tile. **Stagger delays** between stars so they twinkle independently — `${i * 0.4}s` is the convention.

### `.slow-spin` — Wax seal text path

```html
<svg className="slow-spin">…textPath…</svg>
```

Used once, on the rotating wax seal floating off the hero manuscript card. 30s per revolution. Keep this rare — if it appears more than once on a page, it stops being magical.

### `.marquee` — Ticker

See [`patterns.md`](./patterns.md) for the full ticker pattern. The `.marquee` class itself just animates `translateX(0 → -50%)` over 48 seconds. The DOM must duplicate its content so the loop is seamless.

---

## Hover transitions

All hover effects use the same easing curve: `cubic-bezier(0.2, 0.8, 0.2, 1)`. Stay in the 200–500ms range.

| Element | Transform | Color/border change | Duration |
|---|---|---|---|
| `.btn-ember` | `translateY(-2px) rotate(-0.4deg)` | shadow deepens | 250ms |
| `.btn-ghost-ink` | `translateY(-1px)` | bg + border darken | 250ms |
| Choice button | `translateY(-1px)` | border → ember, bg → gold/20, arrow translates + colorizes | 250ms |
| World tile | `translateY(-1px)`, inner SVG `scale(1.06)` | — | card 500ms / SVG 1.2s |
| Wax-seal monogram | `rotate(-6deg)` | — | 500ms |
| Footer link | — | text → ember | 200ms (default) |
| Header nav link | — | foreground/75 → foreground | default |

### Rules

- **Subtle lifts only:** never more than 2px translateY on hover.
- **Tiny rotations** are encouraged on the primary pill button (-0.4°) for a hand-finished feel.
- **Always change color OR transform**, ideally both, so the hover state is felt by both motor and visual feedback.
- **No scale jumps** on cards. Only the inner illustration scales (and only on world tiles, by 6%, over a slow 1.2s).

---

## Don'ts

- ❌ No bouncing easings. No `cubic-bezier` overshoot. No spring physics.
- ❌ No scroll-triggered reveals on body content. The grimoire feels like a printed page; it does not perform on scroll.
- ❌ No infinite loops on interactive elements (buttons, links). Loops are for decorative SVGs only.
- ❌ No fast pulses (< 2s cycles). Twinkle is the fastest cycle in the system at 3.5s.
- ❌ No layout-shifting transforms on text. Headings do not wobble.
- ❌ No fade-out on hover. Hover always *adds* energy, never subtracts.

---

## Reduced motion (planned)

The system does not yet implement `@media (prefers-reduced-motion: reduce)`. When it does, the rule will be:

```css
@media (prefers-reduced-motion: reduce) {
  .drift, .twinkle, .slow-spin, .marquee {
    animation: none !important;
  }
  .rise {
    animation-duration: 0.01s !important;
    animation-delay: 0s !important;
  }
}
```

- **Decorative loops** (`drift`, `twinkle`, `slow-spin`, `marquee`) — disabled entirely.
- **`.rise` reveal** — collapsed to instant so layout still arrives in the right state.
- **Hover transitions** — kept. They are direct user feedback.
- **Wax seal hover rotation** — kept. Same reason.

See [`overview.md`](./overview.md) roadmap item #6.
