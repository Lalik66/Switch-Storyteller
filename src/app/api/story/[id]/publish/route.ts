/**
 * POST /api/story/:id/publish — toggle a story between "published" and the
 * prior status. Owner-only.
 *
 * Eligibility for publishing (PRD §4.3 / §10):
 *   - The parent owns the child profile attached to this story.
 *   - The child profile has `allowPublish = true` (parent has consented).
 *   - The story has at least PUBLISH_MIN_PAGES pages.
 *   - Every page has `moderationStatus = 'safe'` — flagged content must
 *     never reach the Community Feed.
 *
 * Unpublishing has no eligibility check beyond ownership; the parent can
 * always retract.
 */

import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { awardBadges } from "@/lib/badges";
import { db } from "@/lib/db";
import { childProfile, story, storyPage } from "@/lib/schema";

/** Minimum number of pages a story must have before it may be published. */
const PUBLISH_MIN_PAGES = 4;

const bodySchema = z.object({
  publish: z.boolean(),
});

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return json({ error: "Unauthorized" }, 401);

  const { id: storyId } = await params;
  if (!z.string().uuid().safeParse(storyId).success) {
    return json({ error: "Invalid story id" }, 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      400,
    );
  }

  // Verify ownership (parent owns child owns story) in a single query.
  const ownerRows = await db
    .select({ story, child: childProfile })
    .from(story)
    .innerJoin(childProfile, eq(childProfile.id, story.childProfileId))
    .where(
      and(
        eq(story.id, storyId),
        eq(childProfile.parentUserId, session.user.id),
      ),
    )
    .limit(1);

  const ownerRow = ownerRows[0];
  if (!ownerRow) return json({ error: "Story not found" }, 404);

  const { story: targetStory, child } = ownerRow;

  // Unpublish path — always allowed, just flips status back to 'complete'.
  if (!parsed.data.publish) {
    await db
      .update(story)
      .set({ status: "complete" })
      .where(eq(story.id, storyId));
    return json({ status: "complete" }, 200);
  }

  // Publish path — every gate must pass.
  if (!child.allowPublish) {
    return json(
      {
        error: "publish_disallowed",
        message:
          "This child's profile doesn't allow publishing yet. Enable 'allow publishing' on their profile first.",
      },
      403,
    );
  }

  const pages = await db
    .select({
      id: storyPage.id,
      moderationStatus: storyPage.moderationStatus,
    })
    .from(storyPage)
    .where(eq(storyPage.storyId, storyId));

  if (pages.length < PUBLISH_MIN_PAGES) {
    return json(
      {
        error: "too_short",
        message: `Stories need at least ${PUBLISH_MIN_PAGES} pages before they can be published.`,
        currentPageCount: pages.length,
        requiredPageCount: PUBLISH_MIN_PAGES,
      },
      422,
    );
  }

  const flaggedCount = pages.filter(
    (p) => p.moderationStatus !== "safe",
  ).length;
  if (flaggedCount > 0) {
    return json(
      {
        error: "moderation_pending",
        message:
          "Some pages haven't passed moderation yet. Try again once they're cleared.",
        flaggedCount,
      },
      422,
    );
  }

  // Idempotent — publishing an already-published story is a no-op success.
  if (targetStory.status === "published") {
    return json({ status: "published", newBadges: [] }, 200);
  }

  await db
    .update(story)
    .set({ status: "published" })
    .where(eq(story.id, storyId));

  // Phase 3: re-evaluate badges (`published-author` becomes earnable here).
  const newBadges = await awardBadges(db, child.id);

  return json({ status: "published", newBadges }, 200);
}
