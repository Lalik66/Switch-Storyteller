import { eq, and, gte, inArray, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  childProfile,
  story,
  storyPage,
  moderationEvent,
  parentReport,
  type ChildProfile,
} from "@/lib/schema";

export type ChildWeeklySummary = {
  child: ChildProfile;
  storiesCreated: number;
  totalWordsWritten: number;
  totalPages: number;
  moderationIncidents: number;
};

export type ParentWeeklyDigest = {
  parentName: string;
  parentEmail: string;
  weekEnding: Date;
  children: ChildWeeklySummary[];
};

function startOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/**
 * Aggregate weekly stats for a single child profile.
 */
export async function aggregateChildWeek(
  child: ChildProfile,
  since: Date,
): Promise<ChildWeeklySummary> {
  const childStories = await db
    .select({ id: story.id, wordCount: story.wordCount })
    .from(story)
    .where(
      and(
        eq(story.childProfileId, child.id),
        gte(story.createdAt, since),
      )
    );

  const storyIds = childStories.map((s) => s.id);

  let totalPages = 0;
  let moderationIncidents = 0;

  if (storyIds.length > 0) {
    const [pageResult] = await db
      .select({ total: count() })
      .from(storyPage)
      .where(
        and(
          inArray(storyPage.storyId, storyIds),
          gte(storyPage.createdAt, since),
        )
      );
    totalPages = pageResult?.total ?? 0;

    const [modResult] = await db
      .select({ total: count() })
      .from(moderationEvent)
      .where(
        and(
          inArray(moderationEvent.storyId, storyIds),
          gte(moderationEvent.createdAt, since),
        )
      );
    moderationIncidents = modResult?.total ?? 0;
  }

  const totalWords = childStories.reduce((acc, s) => acc + (s.wordCount ?? 0), 0);

  return {
    child,
    storiesCreated: childStories.length,
    totalWordsWritten: totalWords,
    totalPages,
    moderationIncidents,
  };
}

/**
 * Build a weekly digest for all children belonging to a parent.
 */
export async function buildParentDigest(
  parentUserId: string,
  parentName: string,
  parentEmail: string,
): Promise<ParentWeeklyDigest> {
  const since = startOfWeek();
  const weekEnding = new Date();

  const children = await db
    .select()
    .from(childProfile)
    .where(eq(childProfile.parentUserId, parentUserId));

  const summaries: ChildWeeklySummary[] = [];
  for (const child of children) {
    summaries.push(await aggregateChildWeek(child, since));
  }

  return {
    parentName,
    parentEmail,
    weekEnding,
    children: summaries,
  };
}

/**
 * Persist a weekly digest to the parent_report table.
 */
export async function persistDigest(
  digest: ParentWeeklyDigest,
  parentUserId: string,
): Promise<void> {
  for (const summary of digest.children) {
    await db.insert(parentReport).values({
      parentUserId,
      childProfileId: summary.child.id,
      weekEnding: digest.weekEnding,
      storiesCreated: summary.storiesCreated,
      totalWordsWritten: summary.totalWordsWritten,
      moderationIncidents: summary.moderationIncidents,
    });
  }
}

/**
 * Mark a digest as sent (stamp sentAt on all rows for this week).
 */
export async function markDigestSent(
  parentUserId: string,
  weekEnding: Date,
): Promise<void> {
  await db
    .update(parentReport)
    .set({ sentAt: new Date() })
    .where(
      and(
        eq(parentReport.parentUserId, parentUserId),
        eq(parentReport.weekEnding, weekEnding),
      )
    );
}
