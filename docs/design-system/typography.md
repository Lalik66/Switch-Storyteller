# Typography

Three fonts, loaded via `next/font` in [`src/app/layout.tsx`](../../src/app/layout.tsx). Typography is the loudest voice in this system — it is what makes the page feel like a grimoire rather than a SaaS template.

---

## Font stack

| Family | Role | CSS variable | Notes |
|---|---|---|---|
| **Fraunces** | Display | `--font-fraunces` | Variable serif with `SOFT`, `WONK`, and `opsz` axes. Used for every heading, hero display, numerals, buttons, and the wordmark. The `WONK` axis is what gives it personality — **do not disable it**. |
| **Newsreader** | Body | `--font-newsreader` | Warm editorial serif with real italics. Used for long-form paragraphs, story excerpts, and ticker fragments. |
| **JetBrains Mono** | Label | `--font-jetbrains` | Used only for `.eyebrow` labels, folio numbers, and tiny metadata. Never for body or headings. |

### Why these specifically?

- **Fraunces** has a variable `WONK` axis that introduces small, intentional irregularities to letterforms — perfect for the "hand-set type" aesthetic. Its `opsz` (optical size) axis adjusts contrast and stroke thickness automatically between small labels and giant headlines.
- **Newsreader** was designed for on-screen editorial reading, with genuine italics (not slanted roman). At `text-[17px]` on parchment it reads like a book.
- **JetBrains Mono** is reserved as a single "instrumental" voice — small uppercase labels that feel like letterpress metadata.

### Fallbacks

```css
font-family: var(--font-fraunces), Georgia, serif;
font-family: var(--font-newsreader), Georgia, serif;
font-family: var(--font-jetbrains), ui-monospace, monospace;
```

Georgia is the fallback because, if the variable fonts fail to load, it is the closest free system serif that does not collapse the aesthetic.

---

## Type scale

Headings inherit Fraunces globally through `@layer base`:

```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-fraunces), Georgia, serif;
  font-optical-sizing: auto;
  font-variation-settings: "SOFT" 30, "WONK" 1;
  letter-spacing: -0.02em;
}
```

For anything hero-sized, reach for the display helpers defined in `@layer components`:

```css
.display-xl {
  font-variation-settings: "SOFT" 50, "WONK" 1, "opsz" 144;
  font-weight: 500;
  letter-spacing: -0.035em;
  line-height: 0.92;
}

.display-lg {
  font-variation-settings: "SOFT" 40, "WONK" 1, "opsz" 72;
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1;
}

.italic-wonk {
  font-style: italic;
  font-variation-settings: "SOFT" 100, "WONK" 1, "opsz" 144;
}
```

### Scale table

| Use | Class | Size | Example |
|---|---|---|---|
| Hero display | `display-xl` + clamp | `clamp(3.2rem, 8vw, 7.2rem)` | "Where young heroes are forged in ink." |
| Section header | `display-lg` | `text-5xl md:text-6xl` | "Six worlds, hand-drawn and waiting." |
| Card title (large) | default h3 | `text-2xl` | "Wake the fox gently" |
| Card title (small) | default h3 | `text-xl` | "The Moonlit Forest" |
| Body (story) | Newsreader | `text-[17px]` / `leading-[1.85]` | Story paragraphs |
| Body (UI) | Newsreader | `text-[15.5px]` / `leading-relaxed` | Marketing copy, card descriptions |
| Eyebrow label | `.eyebrow` | `0.72rem` uppercase | "§ II · The atlas" |
| Metadata | JetBrains Mono | `text-[10px]`–`text-xs` | Folio numbers, "page 5 / 10" |

---

## Typographic rules

### One italic-wonk word per heading

Every display heading **must** pair with exactly one `.italic-wonk` accent word. This is the system's signature move.

```tsx
// ✅ good
<h2 className="display-lg">
  Three quiet steps.{" "}
  <span className="italic-wonk text-foreground/55">
    One unforgettable tale.
  </span>
</h2>

// ❌ bad — zero accent
<h2 className="display-lg">Three quiet steps. One unforgettable tale.</h2>

// ❌ bad — whole sentence italicized
<h2 className="display-lg italic-wonk">Three quiet steps. One unforgettable tale.</h2>
```

### Section markers use § + roman numerals

Every section opens with an eyebrow label formatted as `§ I · Section name`, `§ II · Section name`, etc. This editorial tic is what keeps the grimoire feel consistent across sections.

```tsx
<p className="eyebrow">&sect; II &middot; The atlas</p>
<h2 className="display-lg mt-4 text-5xl md:text-6xl">…</h2>
```

### HTML entities for punctuation

Always use HTML entities for proper typography. Straight quotes and hyphens break the letterpress feel immediately.

| Entity | Character | Use |
|---|---|---|
| `&mdash;` | — | Em-dash |
| `&ndash;` | – | En-dash (ranges: 7&ndash;12) |
| `&middot;` | · | Separator in eyebrow labels |
| `&ldquo;` / `&rdquo;` | " " | Curly double quotes |
| `&lsquo;` / `&rsquo;` | ' ' | Curly single quotes (it's → it&rsquo;s) |
| `&sect;` | § | Section marker |
| `&check;` | ✓ | Checkmark in status labels |

### Body copy is serif

Do not reach for a sans-serif "for readability." Newsreader was chosen specifically because it is legible at 15.5px+ on parchment. Resist any instinct to mix in Inter, Geist, or system sans.

### Optical sizing is on

Fraunces and Newsreader both run with `font-optical-sizing: auto`, enabled globally in `html`. This lets them trade stroke contrast depending on size — do not override it.

---

## Font feature settings

`html` enables these features project-wide:

```css
font-feature-settings: "ss01", "ss02", "liga", "calt", "kern";
```

- `ss01`, `ss02` — stylistic sets (Fraunces uses them for alternate letter forms)
- `liga` — standard ligatures
- `calt` — contextual alternates
- `kern` — kerning

Do not turn them off per element.

---

## The `.eyebrow` label

Defined once, used everywhere:

```css
.eyebrow {
  font-family: var(--font-jetbrains), ui-monospace, monospace;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: color-mix(in oklch, var(--foreground) 60%, transparent);
}
```

Appears before every section heading, on tiny metadata ("Folio I · page 03"), in the footer signature ("Bound in parchment · Printed with ember"), and as the header subline ("Est. MMXXVI").

Override tracking when needed with `!tracking-[0.18em]` for slightly denser runs.

---

## Localization (planned)

Azerbaijani introduces characters (`ə`, `ı`, `ş`, `ç`, `ö`, `ü`, `ğ`) that need to be verified in both Fraunces and Newsreader before launch. If either font falls short on AZ glyph coverage, document the fallback here and use it via a `lang="az"` selector.

See [`overview.md`](./overview.md) roadmap item #2.
