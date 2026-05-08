/**
 * /admin/moderation — Layer 4 human review queue (PRD §10).
 *
 * Server Component shell. Loads up to 100 outstanding moderation events
 * (highest severity first, then most recent) plus any recently-reviewed
 * rows for context. The interactive review UI is the client child
 * `_queue.tsx` — it owns the per-row "mark reviewed" affordance and
 * notes textarea.
 *
 * Access control:
 *   - The (admin) layout already calls `requireAdmin()`. We re-load it
 *     here only to surface the reviewer's name/id to the client child
 *     (so the audit log shows "reviewed by ...").
 */

import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { moderationEvent, story, user } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { ModerationQueue, type ReviewableEvent } from "./_queue";

const QUEUE_LIMIT = 100;

async function loadQueue(): Promise<ReviewableEvent[]> {
  // Single round-trip: fetch up to QUEUE_LIMIT events, ordered so
  // outstanding work is on top, then highest severity, then most recent.
  // The reviewer columns come back via a LEFT JOIN so already-reviewed
  // rows can show "reviewed by Alice" in the UI for audit context.
  // Severity bucket is mapped to a numeric rank server-side because
  // Postgres' enum default sort is lexicographic, which would surface
  // "low" above "medium" — exactly the wrong order.
  const severityRank = sql<number>`CASE ${moderationEvent.severity}
    WHEN 'high' THEN 0
    WHEN 'medium' THEN 1
    WHEN 'low' THEN 2
    ELSE 3 END`;

  return db
    .select({
      id: moderationEvent.id,
      storyId: moderationEvent.storyId,
      flaggedContent: moderationEvent.flaggedContent,
      reason: moderationEvent.reason,
      severity: moderationEvent.severity,
      actionTaken: moderationEvent.actionTaken,
      reviewedByHuman: moderationEvent.reviewedByHuman,
      reviewedBy: moderationEvent.reviewedBy,
      reviewedAt: moderationEvent.reviewedAt,
      reviewerNotes: moderationEvent.reviewerNotes,
      createdAt: moderationEvent.createdAt,
      storyTitle: story.title,
      reviewerName: user.name,
      reviewerEmail: user.email,
    })
    .from(moderationEvent)
    .innerJoin(story, eq(moderationEvent.storyId, story.id))
    .leftJoin(user, eq(moderationEvent.reviewedBy, user.id))
    .orderBy(
      // false (unreviewed) sorts before true under default ASC ordering.
      moderationEvent.reviewedByHuman,
      severityRank,
      desc(moderationEvent.createdAt),
    )
    .limit(QUEUE_LIMIT);
}

export default async function AdminModerationPage() {
  const session = await requireAdmin();
  const events = await loadQueue();

  const outstanding = events.filter((e) => !e.reviewedByHuman).length;

  return (
    <section className="container mx-auto px-6 py-16 md:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="eyebrow">&sect; Layer IV &middot; Human review</p>
          <h1 className="display-lg mt-3 text-4xl md:text-5xl">
            Moderation queue
          </h1>
          <p className="mt-4 max-w-2xl font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
            Every flagged page or prompt that crossed our automated
            thresholds, awaiting a human read. Highest severity first.
          </p>
        </header>

        <dl className="mb-10 grid grid-cols-3 gap-4">
          <Stat
            value={outstanding}
            label="awaiting review"
            tone="ember"
          />
          <Stat
            value={events.length - outstanding}
            label="recently reviewed"
            tone="ink"
          />
          <Stat value={events.length} label="in view" tone="ink" />
        </dl>

        <ModerationQueue
          events={events}
          reviewerName={session.user.name ?? session.user.email}
        />
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "ember" | "ink";
}) {
  return (
    <div className="border-l border-border/70 pl-4">
      <dt className="eyebrow">{label}</dt>
      <dd
        className={`display-lg mt-1 text-4xl ${
          tone === "ember"
            ? "text-[color:var(--ember)]"
            : "text-foreground/85"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
