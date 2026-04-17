/**
 * Static world manifest for The Hero's Forge — Phase 1.
 *
 * Per PRD §4.1 and §9, Phase 1 intentionally does NOT use runtime image
 * generation for world tiles. Instead, we ship a small curated set of
 * pre-made worlds whose tile art lives at `/public/worlds/<key>.svg` as
 * static assets. This module is the single source of truth for that list
 * and is safe to import from both Server and Client Components — it has
 * zero runtime dependencies.
 */

/**
 * A localized label for both supported launch languages (see PRD §6).
 * English is the secondary language; Azerbaijani is primary.
 */
export type LocalizedText = {
  readonly en: string;
  readonly az: string;
};

/**
 * A single selectable world in the Art-First World Selection step of
 * the Drafting Buddy flow.
 *
 * `key` is the stable slug used as the foreign-key-like reference from
 * `story.world_key` and as the filename stem for the tile image. It must
 * remain URL-safe (lowercase, hyphenated) so it can be round-tripped
 * through route params without encoding.
 */
export type World = {
  key: string;
  name: LocalizedText;
  description: LocalizedText;
  /** Public path to the static tile image; file lives under `public/worlds/`. */
  tileImage: string;
  /** Short English-only vibe keyword used to seed LLM system prompts. */
  vibe: string;
};

/**
 * The Phase 1 starter set of six worlds. The ordering here is the default
 * render order in the world picker; tests and UIs should not rely on it
 * being alphabetical.
 *
 * Azerbaijani translations intentionally use natural child-friendly phrasing
 * rather than literal English equivalents.
 */
export const WORLDS: readonly World[] = [
  {
    key: "enchanted-forest",
    name: {
      en: "Enchanted Forest",
      az: "Sehrli Meşə",
    },
    description: {
      en: "A glowing woodland where talking animals guard ancient secrets.",
      az: "Danışan heyvanların qədim sirləri qoruduğu parıltılı meşə.",
    },
    tileImage: "/worlds/enchanted-forest.svg",
    vibe: "magical woodland, friendly creatures, soft golden light",
  },
  {
    key: "space-station",
    name: {
      en: "Space Station",
      az: "Kosmik Stansiya",
    },
    description: {
      en: "A bustling orbital outpost full of clever robots and zero-gravity hallways.",
      az: "Ağıllı robotlar və çəkisizlik dəhlizləri ilə dolu canlı orbital baza.",
    },
    tileImage: "/worlds/space-station.svg",
    vibe: "friendly sci-fi, helpful robots, bright metal corridors",
  },
  {
    key: "underwater-kingdom",
    name: {
      en: "Underwater Kingdom",
      az: "Sualtı Krallıq",
    },
    description: {
      en: "A sparkling reef city where dolphins carry messages between coral towers.",
      az: "Delfinlərin mərcan qüllələri arasında xəbər daşıdığı parıltılı rif şəhəri.",
    },
    tileImage: "/worlds/underwater-kingdom.svg",
    vibe: "coral city, playful sea animals, turquoise water",
  },
  {
    key: "dragon-mountain",
    name: {
      en: "Dragon Mountain",
      az: "Əjdaha Dağı",
    },
    description: {
      en: "A craggy peak where gentle dragons teach young heroes to soar.",
      az: "Mehriban əjdahaların gənc qəhrəmanlara uçmağı öyrətdiyi qayalıq zirvə.",
    },
    tileImage: "/worlds/dragon-mountain.svg",
    vibe: "gentle dragons, mountain clouds, warm sunrise colors",
  },
  {
    key: "desert-oasis",
    name: {
      en: "Desert Oasis",
      az: "Səhra Vahəsi",
    },
    description: {
      en: "A shimmering palm oasis hiding a hidden library beneath the dunes.",
      az: "Qum təpələri altında gizli kitabxana saxlayan parıltılı palma vahəsi.",
    },
    tileImage: "/worlds/desert-oasis.svg",
    vibe: "warm sands, palm shade, curious camels, hidden library",
  },
  {
    key: "cloud-city",
    name: {
      en: "Cloud City",
      az: "Bulud Şəhəri",
    },
    description: {
      en: "A floating town of rope bridges and rainbow gardens high above the world.",
      az: "Kəndirli körpüləri və göy qurşağı bağları olan səmada üzən şəhər.",
    },
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
