import { headers } from "next/headers";
import { and, asc, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { awardBadges } from "@/lib/badges";
import { db } from "@/lib/db";
import { childProfile, story, storyPage } from "@/lib/schema";

/** Maximum stories (including remixes) a free-tier child may create per rolling 7 days. */
const FREE_TIER_WEEKLY_STORY_LIMIT = 1;

/** How many pages of the source story we clone. PRD §4.3 / impl-plan Phase 3. */
const REMIX_PAGE_COUNT = 4;

const bodySchema = z.object({
  childProfileId: z.string().uuid().optional(),
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

  const { id: sourceStoryId } = await params;
  if (!z.string().uuid().safeParse(sourceStoryId).success) {
    return json({ error: "Invalid story id" }, 400);
  }

  let body: unknown;
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return json(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      400,
    );
  }

  // Resolve the remixer's child profile (must belong to this parent).
  let remixerChild: typeof childProfile.$inferSelect | undefined;
  if (parsed.data.childProfileId) {
    const rows = await db
      .select()
      .from(childProfile)
      .where(
        and(
          eq(childProfile.id, parsed.data.childProfileId),
          eq(childProfile.parentUserId, session.user.id),
        ),
      )
      .limit(1);
    remixerChild = rows[0];
    if (!remixerChild) return json({ error: "Child profile not found" }, 400);
  } else {
    const rows = await db
      .select()
      .from(childProfile)
      .where(eq(childProfile.parentUserId, session.user.id))
      .limit(1);
    remixerChild = rows[0];
    if (!remixerChild) {
      return json({ error: "No child profile found. Create one first." }, 400);
    }
  }

  // Load source story + its child-profile in one go to validate eligibility.
  const sourceRows = await db
    .select({ story, sourceChild: childProfile })
    .from(story)
    .innerJoin(childProfile, eq(childProfile.id, story.childProfileId))
    .where(eq(story.id, sourceStoryId))
    .limit(1);

  const sourceRow = sourceRows[0];
  if (!sourceRow) return json({ error: "Source story not found" }, 404);

  const { story: sourceStory, sourceChild } = sourceRow;

  // Eligibility: only published, public, remix-enabled stories may be cloned.
  // Mirrors the Community Feed gates (PRD §4.3 + §10).
  if (
    sourceStory.status !== "published" ||
    !sourceChild.allowPublish ||
    !sourceChild.allowRemix
  ) {
    return json({ error: "This story isn't available for remix" }, 403);
  }

  // Free-tier rate limit on the remixer (same query as /api/story).
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [storyCountRow] = await db
    .select({ value: count() })
    .from(story)
    .where(
      and(
        eq(story.childProfileId, remixerChild.id),
        gte(story.createdAt, sevenDaysAgo),
      ),
    );
  if (storyCountRow && storyCountRow.value >= FREE_TIER_WEEKLY_STORY_LIMIT) {
    return json(
      {
        error: "rate_limited",
        message:
          "You’ve already started a story this week! Come back next week for a new adventure.",
      },
      429,
    );
  }

  // Load the first N pages of the source. Only pages that passed moderation
  // are eligible to clone — flagged content must never be propagated.
  const sourcePages = await db
    .select()
    .from(storyPage)
    .where(eq(storyPage.storyId, sourceStoryId))
    .orderBy(asc(storyPage.pageNumber))
    .limit(REMIX_PAGE_COUNT);

  const eligiblePages = sourcePages.filter(
    (p) => p.moderationStatus === "safe",
  );
  if (eligiblePages.length === 0) {
    return json({ error: "No remixable pages on this story" }, 422);
  }

  // Recompute aggregate counts from the cloned pages so the new draft is
  // self-consistent rather than copying stale values from the source.
  const clonedWordCount = eligiblePages.reduce(
    (sum, p) =>
      sum +
      (p.aiContent.trim().split(/\s+/).filter(Boolean).length || 0) +
      (p.childContent?.trim().split(/\s+/).filter(Boolean).length ?? 0),
    0,
  );

  // Single transaction so we don't end up with an empty story row if page
  // cloning fails halfway through.
  const newStoryId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(story)
      .values({
        childProfileId: remixerChild.id,
        title: `Remix of ${sourceStory.title}`,
        worldKey: sourceStory.worldKey,
        heroName: sourceStory.heroName,
        problemText: sourceStory.problemText,
        status: "draft",
        wordCount: clonedWordCount,
        chapterCount: 1,
        parentStoryId: sourceStory.id,
      })
      .returning({ id: story.id });

    if (!created) throw new Error("Failed to insert remix story");

    await tx.insert(storyPage).values(
      eligiblePages.map((p, idx) => ({
        storyId: created.id,
        pageNumber: idx + 1,
        aiContent: p.aiContent,
        childContent: p.childContent,
        chosenActionKey: p.chosenActionKey,
        moderationStatus: p.moderationStatus,
        modelUsed: p.modelUsed,
        tokenUsage: p.tokenUsage,
      })),
    );

    return created.id;
  });

  // Phase 3: re-evaluate badges (`remix-master` becomes earnable here).
  const newBadges = await awardBadges(db, remixerChild.id);

  return json(
    {
      storyId: newStoryId,
      clonedPageCount: eligiblePages.length,
      newBadges,
    },
    201,
  );
}
