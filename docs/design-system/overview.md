# Overview — The Hero's Forge Design System

**Codename:** Illuminated Grimoire (cosmic / dark-canvas implementation in code: “Dream Forge Writer” in [`globals.css`](../../src/app/globals.css))
**Version:** 0.2 (docs synced to `globals.css` + layout)
**Last updated:** 2026-04-23

A warm, editorial storybook aesthetic built for an AI storytelling studio for children (ages 7–12) and their parents. The system is designed to feel like a handcrafted illuminated manuscript reinterpreted for the modern web — respectful of kids' intelligence, reassuring for parents, distinct from every other "kids app" on the internet.

---

## Design principles

1. **Warmth over cold tech.** The live palette is **navy + starlight + ember** with **violet** primaries; it should still feel like a storybook, not a default SaaS template.
2. **Craft is the feature.** Hand-drawn ornaments, variable typography, and asymmetric layouts signal that a person made this on purpose.
3. **Reading is the hero.** Every page is a story page in spirit. Typography is sized, spaced, and weighted to invite slow reading.
4. **Intentional asymmetry.** Grids are broken deliberately — tilted cards, roman numerals breaking the baseline, ornaments crossing gutters. Never generic.
5. **One unforgettable moment per section.** A twinkling constellation, a rotating wax seal, a bookmark ribbon. Delight lives in specifics.
6. **Respect the child, reassure the parent.** Playful but never cloying. Safety signals are calm, typographic, and confident — never plastic badges.

---

## How this system is organized

| Document | What's inside |
|---|---|
| [`overview.md`](./overview.md) | This file — principles, philosophy, file map |
| [`colors.md`](./colors.md) | **Authoritative** — brand + semantic tokens (matches [`globals.css`](../../src/app/globals.css)) |
| [`typography.md`](./typography.md) | Fraunces / Newsreader / JetBrains Mono, scale, rules |
| [`spacing-and-layout.md`](./spacing-and-layout.md) | Grid, container, asymmetry, radius, shadow, borders |
| [`components.md`](./components.md) | Buttons, cards, choice buttons, world tiles, header/footer |
| [`patterns.md`](./patterns.md) | Composite patterns — hero, section header, story page, marquee |
| [`animations.md`](./animations.md) | Motion primitives, stagger, timing, reduced motion |
| [`icons.md`](./icons.md) | Inline SVG ornaments — constellations, seals, ornaments |
| [`dark-mode.md`](./dark-mode.md) | After-dark library variant, token flips, contrast notes |

Each document stands alone but cross-links liberally. Start here, then read in any order.

---

## Do & don't (at a glance)

### Do

- ✅ Pair a display heading with one italic-wonk accent word.
- ✅ Use `§` + roman numerals for section markers (§ I, § II, § III…).
- ✅ Tilt cards by 1–3 degrees when they need weight.
- ✅ Break the grid with ornaments, numerals, and constellations.
- ✅ Use **ember (orange)** for one headline accent word and small UI affordances; **violet** primaries and `.btn-ember` for the main CTA.
- ✅ Use HTML entities (`&mdash;`, `&rsquo;`, `&middot;`) for typography.
- ✅ Run `pnpm lint && pnpm typecheck` after every change.

### Don't

- ❌ Don't use raw `#fff` / `#000` for large surfaces—use `background` / `foreground` and brand tokens.
- ❌ Don't use Inter, Roboto, or Geist Sans for anything visible.
- ❌ Don't use sans-serif body copy.
- ❌ Don't use purple gradients, glassmorphism, or neumorphism.
- ❌ Don't add more than two `.btn-ember` instances per viewport.
- ❌ Don't remove the grain overlay or the body gradient.
- ❌ Don't use `italic-wonk` on more than one word per heading.
- ❌ Don't use emojis as UI icons. Inline SVG or nothing.

---

## File map (source)

| File | Role |
|---|---|
| [`src/app/globals.css`](../../src/app/globals.css) | Design tokens, `@theme inline`, `@layer base`, component utility classes. |
| [`src/app/layout.tsx`](../../src/app/layout.tsx) | Font loading, metadata, theme provider, `grain` body class. |
| [`src/app/page.tsx`](../../src/app/page.tsx) | Landing page — reference implementation for every pattern in this system. |
| [`src/components/site-header.tsx`](../../src/components/site-header.tsx) | Wax-seal monogram, nav. |
| [`src/components/localized-site-footer.tsx`](../../src/components/localized-site-footer.tsx) | Localized footer (re-exported from `site-footer.tsx` for legacy imports). |

---

## Roadmap

Before the app proper ships, this system should grow to include:

1. **Form primitives** — restyled `Input`, `Textarea`, `Label`, radio groups for the 3-question intake.
2. **Localized typography** — verify Fraunces + Newsreader Azerbaijani character coverage (ə, ı, ş, ç, ö, ü, ğ) and document fallbacks.
3. **Story page surface** — codify the Sample Page preview into a real `StoryPage` React component.
4. **Parent dashboard palette** — formalize the "night reading room" variant used in the Parents section.
5. **World tile manifest** — register each world with its tone color + illustration asset in `src/lib/worlds.ts`.
6. **Motion guidelines** — add `prefers-reduced-motion` fallbacks once more pages exist.
7. **Bilingual typography rules** — spacing, italic, and hyphenation for EN and AZ.
