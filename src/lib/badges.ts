/**
 * Achievement Badges — Phase 3.
 *
 * The badge *catalog* lives here, not in the DB. Adding a new badge is a
 * code change (new key + i18n strings + criterion); awards are persisted
 * in the `child_badge` table. See PRD §4.3 / impl-plan Phase 3.
 *
 * Award flow:
 *   1. A milestone API (complete / publish / remix) calls `awardBadges()`
 *      after its primary side-effect succeeds.
 *   2. `awardBadges()` recomputes the child's stats, evaluates every badge
 *      criterion, and inserts any newly-earned rows into `child_badge`
 *      with `ON CONFLICT DO NOTHING` (the unique index defends against
 *      double-awards under concurrent requests).
 *   3. The route hand returns `newBadges: BadgeKey[]` so the client can
 *      surface a celebratory toast.
 */

import { and, count, countDistinct, eq, isNotNull, sum } from "drizzle-orm";
import type { db as Db } from "@/lib/db";
import { childBadge, story } from "@/lib/schema";

/** Stable slug used as the persisted `child_badge.badge_key`. */
export type BadgeKey =
  | "first-tale"
  | "triple-quill"
  | "wordsmith"
  | "world-walker"
  | "published-author"
  | "remix-master";

export type BadgeCategory =
  | "completion"
  | "volume"
  | "exploration"
  | "community";

/**
 * Aggregated stats for a single child profile, computed once per
 * `awardBadges()` call and passed to every criterion. Keeping the stats
 * shape concrete (rather than re-querying inside each criterion) keeps
 * the awarder to a single round-trip per metric.
 */
export type BadgeStats = {
  /** Stories with status in ('complete', 'published') — i.e. finished. */
  completedStories: number;
  /** Cumulative `wordCount` across all the child's stories. */
  totalWords: number;
  /** Distinct `worldKey` values across the child's stories. */
  worldsExplored: number;
  /** Stories where `status = 'published'`. */
  publishedStories: number;
  /** Stories the child created via remix (i.e. `parent_story_id IS NOT NULL`). */
  remixesCreated: number;
};

export type Badge = {
  key: BadgeKey;
  category: BadgeCategory;
  /** Emoji shown in chips + toasts. Plain unicode, no icon font. */
  icon: string;
  /** EN/AZ display strings. */
  i18n: {
    en: { name: string; description: string };
    az: { name: string; description: string };
  };
  /** Returns true when this child has now earned the badge. */
  isEarned: (stats: BadgeStats) => boolean;
};

/**
 * The full badge catalog, ordered by progression difficulty. `BADGES_BY_KEY`
 * gives O(1) lookup by key for renderers.
 */
export const BADGES: readonly Badge[] = [
  {
    key: "first-tale",
    category: "completion",
    icon: "📖",
    i18n: {
      en: {
        name: "First Tale",
        description: "Finished your very first story.",
      },
      az: {
        name: "İlk Nağıl",
        description: "İlk nağılını tamamladın.",
      },
    },
    isEarned: (s) => s.completedStories >= 1,
  },
  {
    key: "triple-quill",
    category: "completion",
    icon: "🪶",
    i18n: {
      en: {
        name: "Triple Quill",
        description: "Three completed tales — the quill is yours.",
      },
      az: {
        name: "Üçlü Lələk",
        description: "Üç tamamlanmış nağıl — lələk artıq sənindir.",
      },
    },
    isEarned: (s) => s.completedStories >= 3,
  },
  {
    key: "wordsmith",
    category: "volume",
    icon: "✒️",
    i18n: {
      en: {
        name: "Wordsmith",
        description: "Wrote a thousand words across your tales.",
      },
      az: {
        name: "Söz Ustası",
        description: "Nağıllarında min söz yazdın.",
      },
    },
    isEarned: (s) => s.totalWords >= 1000,
  },
  {
    key: "world-walker",
    category: "exploration",
    icon: "🌍",
    i18n: {
      en: {
        name: "World Walker",
        description: "Set tales in three different worlds.",
      },
      az: {
        name: "Dünya Səyyahı",
        description: "Üç fərqli dünyada nağıl qurdun.",
      },
    },
    isEarned: (s) => s.worldsExplored >= 3,
  },
  {
    key: "published-author",
    category: "community",
    icon: "✦",
    i18n: {
      en: {
        name: "Published Author",
        description: "Sent a tale into the community ledger.",
      },
      az: {
        name: "Nəşr Edən Müəllif",
        description: "Bir nağılı icma jurnalına göndərdin.",
      },
    },
    isEarned: (s) => s.publishedStories >= 1,
  },
  {
    key: "remix-master",
    category: "community",
    icon: "🔁",
    i18n: {
      en: {
        name: "Remix Master",
        description: "Forged your own riff on someone else's tale.",
      },
      az: {
        name: "Remiks Ustası",
        description: "Başqasının nağılına öz dəyişikliyini etdin.",
      },
    },
    isEarned: (s) => s.remixesCreated >= 1,
  },
];

export const BADGES_BY_KEY: Record<BadgeKey, Badge> = Object.fromEntries(
  BADGES.map((b) => [b.key, b]),
) as Record<BadgeKey, Badge>;

export function isKnownBadgeKey(key: string): key is BadgeKey {
  return key in BADGES_BY_KEY;
}

/**
 * Recomputes a child's stats and returns the newly-earned badges (those
 * the criteria say they've earned but that aren't yet in `child_badge`).
 *
 * Uses `ON CONFLICT DO NOTHING` (via the unique index on
 * (child_profile_id, badge_key)) to defend against a race where two
 * concurrent milestone events both try to award the same badge.
 */
export async function awardBadges(
  database: typeof Db,
  childProfileId: string,
): Promise<BadgeKey[]> {
  const stats = await computeBadgeStats(database, childProfileId);
  const candidates = BADGES.filter((b) => b.isEarned(stats)).map((b) => b.key);
  if (candidates.length === 0) return [];

  // Insert every earned badge in a single round-trip. The composite unique
  // index on (child_profile_id, badge_key) makes duplicates a no-op via
  // `onConflictDoNothing`; the `returning` clause yields only the rows that
  // were actually inserted, i.e. the *newly-earned* keys.
  const inserted = await database
    .insert(childBadge)
    .values(
      candidates.map((badgeKey) => ({
        childProfileId,
        badgeKey,
      })),
    )
    .onConflictDoNothing({
      target: [childBadge.childProfileId, childBadge.badgeKey],
    })
    .returning({ badgeKey: childBadge.badgeKey });

  return inserted.map((r) => r.badgeKey as BadgeKey);
}

/**
 * Single-source-of-truth stats computation. Five small queries; could be
 * folded into one CTE later if the awarder becomes hot.
 */
async function computeBadgeStats(
  database: typeof Db,
  childProfileId: string,
): Promise<BadgeStats> {
  const [completeRow, publishedRow, wordsRow, worldsRow, remixesRow] =
    await Promise.all([
      database
        .select({ value: count() })
        .from(story)
        .where(
          and(
            eq(story.childProfileId, childProfileId),
            eq(story.status, "complete"),
          ),
        ),
      database
        .select({ value: count() })
        .from(story)
        .where(
          and(
            eq(story.childProfileId, childProfileId),
            eq(story.status, "published"),
          ),
        ),
      database
        .select({ value: sum(story.wordCount) })
        .from(story)
        .where(eq(story.childProfileId, childProfileId)),
      database
        .select({ value: countDistinct(story.worldKey) })
        .from(story)
        .where(eq(story.childProfileId, childProfileId)),
      // Remixes — stories cloned from a source via the Remix flow.
      database
        .select({ value: count() })
        .from(story)
        .where(
          and(
            eq(story.childProfileId, childProfileId),
            isNotNull(story.parentStoryId),
          ),
        ),
    ]);

  return {
    // "Completed" for badge purposes = both 'complete' and 'published' —
    // a published story is still a finished one.
    completedStories:
      Number(completeRow[0]?.value ?? 0) + Number(publishedRow[0]?.value ?? 0),
    publishedStories: Number(publishedRow[0]?.value ?? 0),
    // sum() returns string in pg driver — coerce.
    totalWords: Number(wordsRow[0]?.value ?? 0),
    worldsExplored: Number(worldsRow[0]?.value ?? 0),
    remixesCreated: Number(remixesRow[0]?.value ?? 0),
  };
}
