# Dark mode — "After-dark library"

The dark variant of the Illuminated Grimoire is not a generic dark mode. It is a specific atmosphere: **candlelight on dark oak**, the same library after closing time. Ember and gold both warm up slightly to feel like they are catching firelight; the parchment flips to deep warm oak.

Activated by adding `class="dark"` to `<html>` (handled by `next-themes` via the `ThemeProvider` in [`src/app/layout.tsx`](../../src/app/layout.tsx)).

---

## Token flips

All tokens listed in [`colors.md`](./colors.md) have a dark counterpart defined under `.dark` in [`src/app/globals.css`](../../src/app/globals.css).

### Brand palette — dark

| Token | Light value | Dark value | Shift |
|---|---|---|---|
| `--parchment` | `oklch(0.948 0.028 82)` | `oklch(0.18 0.014 45)` | Now the **dark background** |
| `--ink` | `oklch(0.18 0.02 45)` | `oklch(0.94 0.03 80)` | Now the **light foreground** |
| `--ember` | `oklch(0.58 0.178 35)` | `oklch(0.68 0.18 38)` | Brightened to glow against ink |
| `--gold` | `oklch(0.76 0.128 80)` | `oklch(0.82 0.13 82)` | Warmed for candlelight |
| `--forest` | `oklch(0.42 0.072 155)` | `oklch(0.58 0.09 158)` | Lightened for visibility |
| `--dusk` | `oklch(0.4 0.082 325)` | `oklch(0.55 0.1 325)` | Lightened for visibility |

### Semantic tokens — dark

| Token | Value |
|---|---|
| `--background` | `var(--parchment)` (now dark oak) |
| `--foreground` | `var(--ink)` (now warm parchment) |
| `--card` | `oklch(0.22 0.018 50)` |
| `--popover` | `oklch(0.22 0.018 50)` |
| `--secondary` | `oklch(0.28 0.02 50)` |
| `--muted` | `oklch(0.26 0.016 48)` |
| `--muted-foreground` | `oklch(0.7 0.03 70)` |
| `--accent` | `var(--gold)` |
| `--primary-foreground` | `oklch(0.15 0.01 40)` (dark text on glowing ember) |
| `--border` | `oklch(1 0 0 / 12%)` |
| `--input` | `oklch(1 0 0 / 16%)` |
| `--destructive` | `oklch(0.65 0.2 28)` |

The clever part: by using semantic aliases (`--background = var(--parchment)`), the entire system flips automatically. Every place in the codebase that uses `bg-background`, `text-foreground`, or `bg-card` simply works.

---

## Atmosphere shifts

### Body gradients

The fixed radial gradients on `<body>` swap proportions in dark mode — ember leads instead of gold, because ember is what reads as candlelight against the dark oak base:

```css
body {
  /* light */
  background-image:
    radial-gradient(ellipse 80% 60% at 20% 0%,
      color-mix(in oklch, var(--gold) 18%, transparent), transparent 60%),
    radial-gradient(ellipse 70% 50% at 100% 30%,
      color-mix(in oklch, var(--ember) 10%, transparent), transparent 55%);
}
.dark body {
  background-image:
    radial-gradient(ellipse 80% 60% at 20% 0%,
      color-mix(in oklch, var(--ember) 14%, transparent), transparent 55%),
    radial-gradient(ellipse 70% 50% at 100% 30%,
      color-mix(in oklch, var(--gold) 10%, transparent), transparent 55%);
}
```

### Grain overlay

The `.grain::before` pseudo-element flips its blend mode and opacity:

| Mode | Blend | Opacity |
|---|---|---|
| Light | `multiply` | `0.18` |
| Dark | `screen` | `0.08` |

`multiply` darkens the parchment to simulate paper texture; `screen` lightens the dark surface so the grain reads as candlelight scatter rather than mud.

---

## Contrast notes

| Pairing | Light ratio | Dark ratio |
|---|---|---|
| `foreground` on `background` | ~13:1 | ~13:1 |
| `ember` on `background` | ~4.8:1 | ~6.2:1 (ember is brighter in dark) |
| `muted-foreground` on `background` | ~6.9:1 | ~5.4:1 |
| `gold` on `background` | ~3.1:1 (large text only) | ~7.8:1 |

**Important:** `gold` does not meet AA for normal text on the light parchment background — it is reserved for **large text** and **decorative ornaments only**. In dark mode it works at all sizes. This asymmetry is intentional and documented; don't try to "fix" gold contrast in light mode by darkening it, because it will lose its preciousness as a highlight color.

---

## Usage notes

### What changes between modes

- All semantic tokens flip automatically — no per-component branching needed.
- The `Parents` section is **already dark in light mode** (uses `bg-[color:var(--ink)]` directly). In dark mode it stays dark — the foreground tokens still resolve correctly because we explicitly use `text-[color:var(--parchment)]` inside it. This double-darkness is intentional: the section is meant to feel like a moment inside an even quieter reading room.
- The grain pseudo-element handles its own mode flip via `.dark .grain::before`.

### What does **not** change

- Roman numerals, the Loop section ember accent, ember CTAs — all stay ember.
- Italic-wonk accent words stay ember in both modes.
- Constellations and star ornaments stay ember/gold.
- World tile tone colors stay constant — the tile's tinted background uses `color-mix(in oklch, <tone> 14%, var(--card))`, so the tile *base* shifts with the card token but the tone color itself is invariant.

### Default mode

The app currently defaults to **light**:

```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
```

With `enableSystem` on, users with `prefers-color-scheme: dark` get the dark variant automatically. The `ModeToggle` in the header lets them override.

---

## When to extend dark mode

If you add a new token, **always define both light and dark values in the same edit**. Never ship a one-mode-only token. The pattern:

```css
:root {
  --new-thing: oklch(...); /* light */
}
.dark {
  --new-thing: oklch(...); /* dark */
}
```

If you find yourself reaching for a hardcoded color "just for dark mode," stop and add a token instead. The system promises that every visible color flips correctly with the theme — the moment a hardcoded color sneaks in, that promise is broken.
