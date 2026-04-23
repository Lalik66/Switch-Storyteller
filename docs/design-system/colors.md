# Colors

**Source of truth:** [`src/app/globals.css`](../../src/app/globals.css). Values below mirror `:root` and `.dark` there; if they disagree, the CSS file wins.

The live app uses a **dark cosmic** base (`--navy`, `--starlight`) with **violet** as the shadcn primary, a fixed **ember** orange for accents, and **OKLCH** for most non-ember hues. `--gold` is currently an **alias of `--ember`** (same `rgb(239, 107, 49)`).

---

## Brand tokens

| Token | Role | Implementation | Notes |
|---|---|---|---|
| `--navy` | Page / surface base | OKLCH (see CSS) | Deep blue-violet background. |
| `--starlight` | Default text on dark | OKLCH | High-contrast light foreground. |
| `--ember` | Brand orange accent | `rgb(239, 107, 49)` | Hero word, language pill, H mark, live badge, `var(--ember)` in UI. |
| `--gold` | Accent alias | `var(--ember)` | Charts, highlights, `.heading-gold` (which sets `color: var(--ember)`). |
| `--violet` | Primary “glow” hue | OKLCH | `--primary`, focus `--ring`, body gradient, **`.btn-ember` fill**. |
| `--cyan` | Secondary chart / tone | OKLCH | Chart-2, accents. |
| `--aurora` | Tertiary chart / tone | OKLCH | Chart-4. |
| `--ink` | Semantic “dark ink” | `var(--navy)` | Parents band background, patterns that say `var(--ink)`. |
| `--parchment` | Semantic “light paper” | `var(--starlight)` | Light text on ink band, `var(--parchment)`. |
| `--forest` | World / success green | OKLCH | World tiles, status, “safely reviewed” dot. Light + dark values in CSS. |
| `--dusk` | World purple | OKLCH | Space / bazaar worlds. Light + dark values in CSS. |

`@theme inline` exposes `--color-navy`, `--color-starlight`, `--color-ember`, `--color-gold`, `--color-violet`, `--color-cyan`, `--color-aurora`, and the semantic names above for Tailwind-style usage.

---

## Semantic tokens (shadcn)

Surfaced via `@theme inline` so utilities like `bg-background`, `text-foreground` work.

| Token | Resolves to (concept) | Use |
|---|---|---|
| `--background` | `var(--navy)` | Body |
| `--foreground` | `var(--starlight)` | Body text |
| `--card` / `--popover` | OKLCH purple-tinted surfaces | Cards, popovers |
| `--primary` | `var(--violet)` | **Not** ember—violet is the main CTA / ring color in tokens |
| `--primary-foreground` | `var(--starlight)` | Text on primary surfaces |
| `--accent` | `var(--gold)` (= ember) | Accent surfaces; pairs with `--accent-foreground` on `navy` |
| `--ring` | `var(--violet)` | Focus rings |
| `--chart-1` … `--chart-5` | violet, cyan, gold, aurora, + one extra | Charts |

The **named** CTA class `.btn-ember` in CSS is a **violet** pill (legacy name; see [`components.md`](./components.md)).

---

## Usage rules

### Ember / gold (orange)

- One **hero** accent word: `.heading-gold` on a `<span>`, or inline `text-[color:var(--ember)]`.
- Small UI: language switcher active state, header monogram, manuscript “live” line, eyebrow dot.
- Do not flood the viewport—keep orange for emphasis and navigation affordances.

### Violet

- Default **primary** in design tokens, **primary CTA** (`.btn-ember`), and ambient **body** gradients.
- Pairs with `next-themes` / `class="dark"` for Tailwind `dark:` utilities.

### Forest / dusk

- Use for **world identity**, choice tiles, and green/purple status—not as a second orange.

### `color-mix`

Prefer `color-mix(in oklch, var(--foreground) N%, transparent)` (and similar) for borders and shadows so both themes stay coherent.

```css
border: 1px solid color-mix(in oklch, var(--foreground) 10%, transparent);
```

---

## Contrast

Re-check any new pair with an OKLCH or APCA tool. **Ember** on `--background` and **violet** on starlight-foreground for buttons are the main interactive pairings to validate when tokens change.

---

See [`dark-mode.md`](./dark-mode.md) for `class="dark"` on `<html>`, `ThemeProvider`, and what shifts between light and dark **classes** (the implementation uses the same `navy` / `starlight` names with different OKLCH numbers under `.dark`).
