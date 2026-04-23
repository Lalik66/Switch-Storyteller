# Dark mode — `class` on `<html>`

The UI uses [next-themes](https://github.com/pacocoursey/next-themes) with the **`class`** strategy: `class="light"` or `class="dark"` is applied to **`<html>`** (see [`src/app/layout.tsx`](../../src/app/layout.tsx)).

**Implementation today:** only two stored themes, **no system** override:

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem={false}
  disableTransitionOnChange
>
```

- **`defaultTheme="dark"`** — new visitors and cleared storage get the dark class first.
- **`enableSystem={false}`** — users choose **light** or **dark** explicitly (header **Mode** control toggles; no “follow OS” in this provider).
- **`suppressHydrationWarning`** on `<html>` avoids flash-of-wrong-theme warnings while `next-themes` hydrates.

`ModeToggle` ([`src/components/ui/mode-toggle.tsx`](../../src/components/ui/mode-toggle.tsx)) calls `setTheme("light" | "dark")` and defers theme-dependent `aria-label` / icons until after mount to **avoid React hydration mismatches** with `resolvedTheme`.

---

## Token flips (`.dark`)

`globals.css` defines brand and semantic variables under **`:root`** and overrides many of them under **`.dark`** (same property names, different OKLCH / same `rgb` for ember). Examples:

- `--navy` and `--starlight` get slightly different OKLCH in `.dark` (deeper page, crisper text).
- `--violet`, `--cyan`, `--aurora`—adjusted for dark.
- `--ember: rgb(239, 107, 49)` is **the same** in both roots for a consistent brand orange.
- `--gold` remains `var(--ember)`.
- `--ink` / `--parchment` stay aliases: `var(--navy)` / `var(--starlight)` and track the flips.
- `--forest` / `--dusk` have separate light- and dark-mode OKLCH values for world/situational use.

Component styles should use **semantic** tokens (`background`, `foreground`, `card`, `border`, …) or brand tokens so they track `.dark` without extra React branching.

---

## Body gradients

Fixed **radial** layers on `body` use **violet** and **gold** (not ember in the gradient itself):

- Default (`:root` / light class): `16%` / `12%` mixes in the first and second gradient.
- `.dark body`: `18%` / `14%` (slightly stronger glints).

See the exact `background-image` blocks in [`src/app/globals.css`](../../src/app/globals.css) `body` and `.dark body`.

---

## Grain overlay (`.grain`)

`body` carries the `grain` class in [`layout.tsx`](../../src/app/layout.tsx). The texture is a fixed **SVG noise** layer:

| Rule | `mix-blend-mode` | Opacity |
|---|---|---|
| `.grain::before` | `overlay` | `0.12` |
| `.dark .grain::before` | `overlay` | `0.10` |

`pointer-events: none` so it never blocks clicks.

---

## When you add a new token

Define values in **both** `:root` and `.dark` in the same change (or use aliases that only reference other tokens you already override). Avoid hard-coded hex in components when a token exists or should exist.

---

## Contrast

Re-measure `foreground` on `background` and key accents after any token change. The previous doc’s “parchment-only / gold on parchment” rules applied to an older **light-first** draft; the **implemented** look is **dark-base + orange accent + violet primary**.
