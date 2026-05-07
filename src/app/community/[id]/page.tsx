/**
 * Public read-only reader — `/community/:id`.
 *
 * Loads any story that satisfies the Community Feed gate
 * (`status='published'` AND `child.allow_publish = true`). Anyone signed
 * in can view it. Owners do NOT get the interactive editor here — they
 * still go through `/story/:id` for that.
 *
 * Also surfaces the source's `allow_remix` flag so the public reader can
 * conditionally show the Remix button.
 */

import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { childProfile, story, storyPage } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { PublicReader } from "./_public-reader";

async function loadPublishedStory(storyId: string) {
  const rows = await db
    .select({
      story,
      authorName: childProfile.displayName,
      allowRemix: childProfile.allowRemix,
    })
    .from(story)
    .innerJoin(childProfile, eq(childProfile.id, story.childProfileId))
    .where(
      and(
        eq(story.id, storyId),
        eq(story.status, "published"),
        eq(childProfile.allowPublish, true),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Only render pages that passed moderation. Defence-in-depth: the
  // publish gate already rejects stories with non-safe pages, but if
  // anything regresses, the public view still won't show flagged text.
  const pages = await db
    .select()
    .from(storyPage)
    .where(
      and(eq(storyPage.storyId, storyId), eq(storyPage.moderationStatus, "safe")),
    )
    .orderBy(asc(storyPage.pageNumber));

  return {
    story: row.story,
    pages,
    authorName: row.authorName,
    canRemix: row.allowRemix,
  };
}

export default async function CommunityStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const result = await loadPublishedStory(id);
  if (!result) notFound();

  return (
    <PublicReader
      storyId={id}
      story={result.story}
      pages={result.pages}
      authorName={result.authorName}
      canRemix={result.canRemix}
    />
  );
}
