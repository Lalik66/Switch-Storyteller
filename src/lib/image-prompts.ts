import { createHash } from "crypto";

const WORLD_SETTINGS: Readonly<Record<string, string>> = {
  "enchanted-forest":
    "an enchanted forest with glowing mushrooms, ancient twisted trees draped in moss, and soft fairy-light filtering through the canopy",
  "space-station":
    "a gleaming space station suspended among stars and swirling nebulae, with curved corridors and viewing ports onto the cosmos",
  "underwater-kingdom":
    "a luminous underwater kingdom of coral towers, schools of colourful fish, and bioluminescent sea plants casting soft blue-green light",
  "dragon-mountain":
    "a craggy volcanic mountain peak with smouldering craters, obsidian rocks, and soaring dragons silhouetted against an amber sky",
  "desert-oasis":
    "a golden desert oasis shaded by tall palms and flowering shrubs beside a mirrorlike pool under a vast star-filled sky",
  "cloud-city":
    "a floating cloud city of ivory spires, rope bridges, and hot-air balloons drifting through a sunrise sky painted in pink and gold",
};

/**
 * Build the image-generation prompt for a single story page.
 *
 * The result is deterministic given the same inputs, making it safe to hash
 * as a cache key. Keep changes here minimal — altering this output
 * invalidates all cached scene hashes.
 */
export function buildScenePrompt(
  pageText: string,
  heroName: string,
  worldKey: string,
): string {
  const setting =
    WORLD_SETTINGS[worldKey] ?? worldKey.replace(/-/g, " ");

  // Truncate to 400 chars so the hash stays stable regardless of model output length.
  const excerpt = pageText.replace(/\s+/g, " ").trim().slice(0, 400);

  return [
    "Children's illustrated storybook art, warm watercolour and pencil style, soft inviting palette.",
    `Setting: ${setting}.`,
    `Scene featuring the hero ${heroName}: ${excerpt}`,
    "No text, letters, or words visible anywhere in the image.",
    "G-rated, age-appropriate for children aged 7–12, no violence, no frightening imagery.",
    "Rich detail, full colour, storybook quality.",
  ].join(" ");
}

/**
 * SHA-256 of the normalised prompt — used as the cache key in `story_image.scene_hash`.
 * Normalisation (trim + lowercase) ensures byte-identical prompts always
 * produce the same hash regardless of whitespace drift.
 */
export function sceneHash(prompt: string): string {
  return createHash("sha256")
    .update(prompt.trim().toLowerCase())
    .digest("hex");
}
