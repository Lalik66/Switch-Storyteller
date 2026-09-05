/**
 * Maps between parent-facing strictness tiers in the Children UI and the
 * `content_strictness` enum stored in Postgres (`standard` | `strict`).
 *
 * The UI exposes age-oriented labels (soft / standard / brave). The story
 * engine only understands moderation depth (standard / strict). Younger
 * profiles map to the stricter moderation tier.
 */

export type UiStrictness = "soft" | "standard" | "brave";
export type DbStrictness = "standard" | "strict";

export function uiStrictnessToDb(tier: UiStrictness): DbStrictness {
  return tier === "soft" ? "strict" : "standard";
}

export function dbStrictnessToUi(
  db: DbStrictness,
  age: number,
): UiStrictness {
  if (db === "strict") return "soft";
  if (age >= 12) return "brave";
  return "standard";
}
