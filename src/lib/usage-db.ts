import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { childUsageDaily } from "@/lib/schema";
import { HEARTBEAT_INTERVAL_SECONDS, HEARTBEAT_MAX_CREDIT_SECONDS, usageDateFor } from "@/lib/usage";

/**
 * P1-1 — the database side of daily screen-time metering. Split from
 * `usage.ts` so the pure helpers there stay importable (and unit-testable)
 * without a live database connection.
 */

/** Seconds already used by this child today (Asia/Baku). 0 when no row exists. */
export async function getSecondsUsedToday(
  childProfileId: string,
  now: Date = new Date(),
): Promise<number> {
  const usageDate = usageDateFor(now);
  const [row] = await db
    .select({ secondsUsed: childUsageDaily.secondsUsed })
    .from(childUsageDaily)
    .where(
      and(
        eq(childUsageDaily.childProfileId, childProfileId),
        eq(childUsageDaily.usageDate, usageDate),
      ),
    )
    .limit(1);
  return row?.secondsUsed ?? 0;
}

/**
 * Credit one heartbeat and return the day's running total. Atomic upsert on the
 * (child, day) unique index:
 *   - first beat of the day → insert one interval's worth of seconds;
 *   - later beats → add the real elapsed time since the last beat, clamped to
 *     [0, HEARTBEAT_MAX_CREDIT_SECONDS] in SQL so concurrent tabs stay correct.
 */
export async function creditHeartbeat(
  childProfileId: string,
  now: Date = new Date(),
): Promise<number> {
  const usageDate = usageDateFor(now);
  const [row] = await db
    .insert(childUsageDaily)
    .values({
      childProfileId,
      usageDate,
      secondsUsed: HEARTBEAT_INTERVAL_SECONDS,
    })
    .onConflictDoUpdate({
      target: [childUsageDaily.childProfileId, childUsageDaily.usageDate],
      set: {
        secondsUsed: sql`${childUsageDaily.secondsUsed} + LEAST(GREATEST(EXTRACT(EPOCH FROM (now() - ${childUsageDaily.updatedAt})), 0), ${HEARTBEAT_MAX_CREDIT_SECONDS})::int`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ secondsUsed: childUsageDaily.secondsUsed });
  return row?.secondsUsed ?? HEARTBEAT_INTERVAL_SECONDS;
}
