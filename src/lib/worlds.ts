/**
 * Static world manifest for The Hero's Forge — Phase 1.
 *
 * Per PRD §4.1 and §9, Phase 1 intentionally does NOT use runtime image
 * generation for world tiles. Instead, we ship a small curated set of
 * pre-made worlds whose tile art lives at `/public/worlds/<key>.svg` as
 * static assets. This module is the single source of truth for that list
 * and is safe to import from both Server and Client Components — it has
 * zero runtime dependencies.
 *
 * Localized display copy (name + description) lives in the `Worlds`
 * namespace of `messages/{en,az}.json` keyed by `world.key`. Resolve it
 * at render time via `useTranslations("Worlds")` (client / sync server)
 * or `getTranslations("Worlds")` (async server). Keeping the dictionary
 * out of this file lets the catalog be a server-safe, tree-shakeable
 * constant with no JSON-shape duplication.
 */

/**
 * A single selectable world in the Art-First World Selection step of
 * the Drafting Buddy flow.
 *
 * `key` is the stable slug used as the foreign-key-like reference from
 * `story.world_key`, as the filename stem for the tile image, AND as the
 * lookup key into the `Worlds` messages namespace. It must remain
 * URL-safe (lowercase, hyphenated) so it can be round-tripped through
 * route params without encoding.
 */
export type World = {
  key: WorldKey;
  /** Public path to the static tile image; file lives under `public/worlds/`. */
  tileImage: string;
  /** Short English-only vibe keyword used to seed LLM system prompts. */
  vibe: string;
};

/** String-literal union of all known world keys — keeps lookups type-safe. */
export type WorldKey =
  | "enchanted-forest"
  | "space-station"
  | "underwater-kingdom"
  | "dragon-mountain"
  | "desert-oasis"
  | "cloud-city";

/**
 * The Phase 1 starter set of six worlds. The ordering here is the default
 * render order in the world picker; tests and UIs should not rely on it
 * being alphabetical.
 */
export const WORLDS: readonly World[] = [
  {
    key: "enchanted-forest",
    tileImage: "/worlds/enchanted-forest.svg",
    vibe: "magical woodland, friendly creatures, soft golden light",
  },
  {
    key: "space-station",
    tileImage: "/worlds/space-station.svg",
    vibe: "friendly sci-fi, helpful robots, bright metal corridors",
  },
  {
    key: "underwater-kingdom",
    tileImage: "/worlds/underwater-kingdom.svg",
    vibe: "coral city, playful sea animals, turquoise water",
  },
  {
    key: "dragon-mountain",
    tileImage: "/worlds/dragon-mountain.svg",
    vibe: "gentle dragons, mountain clouds, warm sunrise colors",
  },
  {
    key: "desert-oasis",
    tileImage: "/worlds/desert-oasis.svg",
    vibe: "warm sands, palm shade, curious camels, hidden library",
  },
  {
    key: "cloud-city",
    tileImage: "/worlds/cloud-city.svg",
    vibe: "sky town, rainbow gardens, soft pastel clouds",
  },
] as const;

/**
 * Look up a world by its stable `key`. Returns `undefined` if the key is
 * unknown, so callers can decide whether a missing world is a 404 or a
 * silent fallback. This is intentionally a linear scan — the list is
 * tiny and is likely to stay under ~20 entries for the life of Phase 1.
 */
export function getWorld(key: string): World | undefined {
  return WORLDS.find((world) => world.key === key);
}

/** True when `key` is one of the catalog's stable slugs. */
export function isKnownWorldKey(key: string): key is WorldKey {
  return WORLDS.some((world) => world.key === key);
}
