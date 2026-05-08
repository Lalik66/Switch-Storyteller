/**
 * Story reader — §4.1 / §5 / §6 of
 * `.claude/plans/sequential-bubbling-horizon.md`.
 *
 * Server Component shell: does the protected-session check and stubs
 * the story + pages DB load. The actual Drizzle query lives behind a
 * TODO so the schema-agent can drop it in once `@/lib/schema` lands.
 * Interactive bits (action buttons, custom action, streaming) are
 * delegated to the `<StoryReader>` client child below.
 */

import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
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
    // Until the schema-agent wires `loadStoryWithPages`, every hit
    // lands here. That keeps Phase 1 compiling without polluting the
    // client tree with fake data.
    notFound();
  }

  return (
    <StoryReader
      storyId={id}
      initialStory={result.story}
      initialPages={result.pages}
      canRemix={result.canRemix}
    />
  );
}
