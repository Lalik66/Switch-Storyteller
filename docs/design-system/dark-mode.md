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

`globals.css` defines the six brand tokens and the semantic shadcn variables under **`:root`** and overrides them under **`.dark`** (same property names, different OKLCH values). The brand tokens are first-class — not aliases of one another. Examples:

- `--parchment` (page surface) and `--ink` (text) take different OKLCH in `.dark`: parchment flips from cream to a near-midnight blue-violet, ink from deep ink to cream starlight.
- `--ember` shifts slightly lighter in `.dark` (`oklch(0.58 …)` → `oklch(0.68 …)`) so the brand orange stays legible on the navy surface.
- `--gold` is a **distinct** warm yellow (never an alias of `--ember`), with its own light and dark values.
- `--forest` / `--dusk` have separate light- and dark-mode OKLCH values for world/situational use.

Component styles should use **semantic** tokens (`background`, `foreground`, `card`, `border`, …) or brand tokens so they track `.dark` without extra React branching.

---

## Body gradients

Fixed **radial** layers on `body` use **gold** and **ember**:

- Light (`:root`): gold at `18%`, then ember at `10%`.
- `.dark body`: ember at `14%`, then gold at `10%` (the warmer pair leads on the navy ground).

See the exact `background-image` blocks in [`src/app/globals.css`](../../src/app/globals.css) `body` and `.dark body`.

---

## Grain overlay (`.grain`)

`body` carries the `grain` class in [`layout.tsx`](../../src/app/layout.tsx). The texture is a fixed **SVG noise** layer:

| Rule | `mix-blend-mode` | Opacity |
|---|---|---|
| `.grain::before` | `multiply` | `0.18` |
| `.dark .grain::before` | `screen` | `0.08` |

`pointer-events: none` so it never blocks clicks.

---

## When you add a new token

Define values in **both** `:root` and `.dark` in the same change (or use aliases that only reference other tokens you already override). Avoid hard-coded hex in components when a token exists or should exist.

---

## Contrast

Re-measure `foreground` on `background` and key accents after any token change. The **implemented** look is **dark-base (cosmic navy) + ember-orange accent + gold highlight**, with light mode the parchment-base mirror of the same accents. Tokens are locked — these checks matter only if a change is proposed *and* owner-approved.
