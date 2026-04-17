# Colors

All colors are defined in [`src/app/globals.css`](../../src/app/globals.css) using **OKLCH** for perceptual uniformity. Brand tokens are surfaced both as semantic shadcn tokens (`--background`, `--primary`, …) and as raw brand tokens (`--parchment`, `--ink`, `--ember`, `--gold`, `--forest`, `--dusk`).

---

## Brand palette — light mode

| Token | Role | OKLCH | Notes |
|---|---|---|---|
| `--parchment` | Page background | `oklch(0.948 0.028 82)` | Warm cream. Never pure white. |
| `--ink` | Foreground text | `oklch(0.18 0.02 45)` | Warm near-black, slightly cooler than the background. |
| `--ember` | Primary accent | `oklch(0.58 0.178 35)` | Wax-seal red-orange. Primary CTAs, emphasis, ornaments. |
| `--gold` | Secondary accent | `oklch(0.76 0.128 80)` | Antique gold. Highlights, constellations, tilted backdrop cards. |
| `--forest` | Tertiary | `oklch(0.42 0.072 155)` | Moonlit-forest world tiles, "safely reviewed" dot. |
| `--dusk` | Tertiary | `oklch(0.4 0.082 325)` | Stardust Bazaar world tiles and dusk moments. |

### Why OKLCH?

OKLCH is perceptually uniform — a lightness of `0.58` on ember feels the same brightness as `0.58` on forest. This makes it trivial to build accessible pairings without manually tweaking every combination. It also plays well with `color-mix(in oklch, …)`, which the component layer uses heavily for borders, shadows, and subtle tints.

---

## Semantic tokens — light mode

Surfaced via `@theme inline` so Tailwind utilities like `bg-background`, `text-foreground`, `border-border` work as expected.

| Token | Value | Use |
|---|---|---|
| `--background` | `var(--parchment)` | Body |
| `--foreground` | `var(--ink)` | Body text |
| `--card` | `oklch(0.972 0.022 86)` | Slightly lighter parchment for cards |
| `--popover` | `oklch(0.972 0.022 86)` | Dropdowns, tooltips |
| `--primary` | `var(--ember)` | Primary CTAs |
| `--primary-foreground` | `oklch(0.98 0.015 85)` | Text on ember |
| `--secondary` | `oklch(0.9 0.034 78)` | Secondary surfaces |
| `--secondary-foreground` | `var(--ink)` | Text on secondary |
| `--muted` | `oklch(0.9 0.026 80)` | Quiet surfaces |
| `--muted-foreground` | `oklch(0.44 0.028 55)` | Secondary text |
| `--accent` | `var(--gold)` | Highlight surfaces |
| `--accent-foreground` | `var(--ink)` | Text on gold |
| `--destructive` | `oklch(0.55 0.22 27)` | Errors, destructive actions |
| `--border` | `oklch(0.78 0.042 72)` | Warm sepia border |
| `--input` | `oklch(0.85 0.032 75)` | Form field border |
| `--ring` | `var(--ember)` | Focus rings |

Chart tokens (`--chart-1`…`--chart-5`) are mapped to ember, gold, forest, dusk, and a cool blue for future dashboards.

---

## Usage rules

### Ember is load-bearing

Reserve `--ember` for:

- Primary CTAs (`.btn-ember`)
- The wax-seal monogram in the header
- Italic emphasis words inside headings (`.italic-wonk`)
- Roman numerals in The Loop section
- Folio badges and the Sample Page bookmark ribbon
- Focus rings

**Do not** dilute ember with decorative use. If it appears more than twice in a viewport outside of headings, the design is getting loud.

### Gold is a highlight, never a surface

Gold is perfect for:

- Marker highlights on specific words: `bg-[color:var(--gold)]/40 px-0.5`
- Constellation stars and twinkling ornaments
- The tilted backdrop card behind the hero manuscript
- Footer divider ornaments

Never use gold as a page background or a large surface. It loses its preciousness fast.

### Forest and dusk are situational

Only use forest and dusk to give **world tiles** identity in the Worlds Atlas. Do not promote them to UI accents; they will clash with ember.

### Never pure white or pure black

The warmth of parchment and ink is non-negotiable. Even icons default to `currentColor` inheriting from foreground, so they pick up the warm ink tone automatically.

```html
<!-- ✅ good -->
<div class="bg-background text-foreground">…</div>

<!-- ❌ bad -->
<div class="bg-white text-black">…</div>
```

---

## Contrast reference

| Pairing | Ratio | WCAG |
|---|---|---|
| `ink` on `parchment` | ~13:1 | AAA for all text |
| `ember` on `parchment` | ~4.8:1 | AA normal, AAA large |
| `ember-foreground` on `ember` (button fill) | ~5.1:1 | AA |
| `muted-foreground` on `parchment` | ~6.9:1 | AAA large, AA normal |
| `parchment` on `ink` (dark inverse) | ~13:1 | AAA |

Any new token pairings must meet **AA for normal text** (4.5:1) at minimum. Use an OKLCH contrast checker such as [oklch.com](https://oklch.com) before adding pairings.

---

## Working with `color-mix`

The component layer uses `color-mix(in oklch, …)` heavily for subtle tints. Favor it over hardcoded hex values:

```css
/* Soft border */
border: 1px solid color-mix(in oklch, var(--foreground) 10%, transparent);

/* Warm shadow */
box-shadow: 0 14px 30px -18px
  color-mix(in oklch, var(--foreground) 30%, transparent);

/* Tinted card background */
background: color-mix(in oklch, var(--forest) 14%, var(--card));
```

This keeps dark mode and future palette shifts automatic.

---

See [`dark-mode.md`](./dark-mode.md) for how each token flips in the "after-dark library" variant.
