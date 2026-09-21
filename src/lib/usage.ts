import type { ChildProfile } from "@/lib/schema";

/**
 * P1-1 — daily screen-time enforcement (pure logic).
 *
 * A child's `daily_minute_limit` is stored and shown to parents but was never
 * read by the story loop. This module holds the pure, unit-testable pieces:
 * the day-bucket boundary, the heartbeat credit clamp, and the limit check.
 * The DB reads/writes that use them live in `usage-db.ts` (kept separate so
 * these stay importable without a database connection).
 *
 * The "day" is a fixed Asia/Baku calendar day for every family: Azerbaijan is
 * UTC+4 with no DST, so a single constant gives a stable, tamper-proof reset at
 * local midnight regardless of the server's timezone.
 */

/** Fixed app timezone for the daily reset boundary (UTC+4, no DST). */
export const APP_TIMEZONE = "Asia/Baku";

/** Reader heartbeat cadence — the client posts one beat per this interval. */
export const HEARTBEAT_INTERVAL_SECONDS = 30;

/**
 * Upper bound on the seconds a single heartbeat may credit. Bounds both a long
 * gap (tab backgrounded, laptop asleep) and rapid/duplicate calls, so neither
 * a missed beat nor a flood can materially inflate or deflate the count.
 */
export const HEARTBEAT_MAX_CREDIT_SECONDS = 90;

/** en-CA formats as YYYY-MM-DD; reused across calls (constructing it is cheap but not free). */
const bakuDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The Asia/Baku calendar day for `now`, as 'YYYY-MM-DD'. */
export function usageDateFor(now: Date = new Date()): string {
  // en-CA yields "2026-09-17"; guard against locale/runtime quirks by
  // normalising separators just in case a runtime returns "2026/09/17".
  return bakuDayFormatter.format(now).replace(/\//g, "-");
}

/** Clamp a raw elapsed delta into the allowed per-heartbeat credit range. */
export function clampCredit(deltaSeconds: number): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0;
  return Math.min(deltaSeconds, HEARTBEAT_MAX_CREDIT_SECONDS);
}

/**
 * Pure limit check. `daily_minute_limit` null → no limit (never over). Exposed
 * separately from the DB read so it can be unit-tested and reused by callers
 * that already hold the child row.
 */
export function overDailyLimit(
  child: Pick<ChildProfile, "dailyMinuteLimit">,
  usedSeconds: number,
): { over: boolean; usedSeconds: number; limitSeconds: number | null } {
  const limit = child.dailyMinuteLimit;
  if (limit == null) {
    return { over: false, usedSeconds, limitSeconds: null };
  }
  const limitSeconds = limit * 60;
  return { over: usedSeconds >= limitSeconds, usedSeconds, limitSeconds };
}
