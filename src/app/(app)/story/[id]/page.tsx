/**
 * Story reader — §4.1 / §5 / §6 of
 * `.claude/plans/sequential-bubbling-horizon.md`.
 *
 * Server Component shell: runs the protected-session check and loads the
 * story plus its pages from Postgres via Drizzle (`@/lib/schema`).
 * Interactive bits (action buttons, custom action, streaming) are
 * delegated to the `<StoryReader>` client child below.
 */

import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { isCommunityEnabled } from "@/lib/env";
import { childProfile, story, storyPage } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { StoryReader } from "./_reader";
import type { InferSelectModel } from "drizzle-orm";

type Story = InferSelectModel<typeof story>;
type StoryPage = InferSelectModel<typeof storyPage>;

/**
 * Fetches the story and its ordered pages for the current user.
 *
 * Authorization: JOINs through `childProfile` to verify the parent
 * owns the child profile attached to this story. Returns `null` when
 * the story does not exist or does not belong to the caller.
 *
 * Also returns `canRemix` — whether this story currently meets the
 * Phase 3 remix-eligibility gate (status=published + allowPublish +
 * allowRemix). Computed server-side so the client never decides.
 */
async function loadStoryWithPages(
  storyId: string,
  userId: string
): Promise<{ story: Story; pages: StoryPage[]; canRemix: boolean } | null> {
  // Verify story exists AND the parent owns the linked child profile.
  const storyRows = await db
    .select({
      story,
      allowPublish: childProfile.allowPublish,
      allowRemix: childProfile.allowRemix,
    })
    .from(story)
    .innerJoin(childProfile, eq(childProfile.id, story.childProfileId))
    .where(and(eq(story.id, storyId), eq(childProfile.parentUserId, userId)))
    .limit(1);

  const storyRow = storyRows[0];
  if (!storyRow) return null;

  // Load all pages ordered by page number ascending.
  const pages = await db
    .select()
    .from(storyPage)
    .where(eq(storyPage.storyId, storyId))
    .orderBy(asc(storyPage.pageNumber));

  const canRemix =
    storyRow.story.status === "published" &&
    storyRow.allowPublish &&
    storyRow.allowRemix;

  return { story: storyRow.story, pages, canRemix };
}

export default async function StoryReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;

  const result = await loadStoryWithPages(id, session.user.id);

  if (!result) {
    // No such story, or it isn't owned by this parent's family —
    // `loadStoryWithPages` returns null in both cases.
    notFound();
  }

  return (
    <StoryReader
      storyId={id}
      initialStory={result.story}
      initialPages={result.pages}
      canRemix={result.canRemix}
      communityEnabled={isCommunityEnabled()}
    />
  );
}
