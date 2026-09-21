import { headers } from "next/headers";
import { and, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { moderatePrompt } from "@/lib/moderation";
import { childProfile, story } from "@/lib/schema";
import { overDailyLimit } from "@/lib/usage";
import { getSecondsUsedToday } from "@/lib/usage-db";
import { getWorld } from "@/lib/worlds";

/** Maximum stories a free-tier child profile may create within a rolling 7-day window. */
const FREE_TIER_WEEKLY_STORY_LIMIT = 1;

const bodySchema = z.object({
  heroName: z.string().min(1).max(100),
  worldKey: z.string().min(1).max(100),
  problem: z.string().min(1).max(2000),
  lang: z.enum(["en", "az"]),
  childProfileId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  // Verify parent session.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse + validate body.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { heroName, worldKey, problem, lang, childProfileId } = parsed.data;

  // Validate that the selected world exists in the static manifest.
  const world = getWorld(worldKey);
  if (!world) {
    return new Response(JSON.stringify({ error: "Unknown world" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Resolve target child profile. When `childProfileId` is supplied,
  // scope the lookup to this parent so a caller cannot attach a story to
  // a sibling account's child. Otherwise fall back to the first child
  // belonging to this parent (backward-compatible for single-child families).
  let child: typeof childProfile.$inferSelect | undefined;

  if (childProfileId) {
    const scopedRows = await db
      .select()
      .from(childProfile)
      .where(
        and(
          eq(childProfile.id, childProfileId),
          eq(childProfile.parentUserId, session.user.id),
        ),
      )
      .limit(1);
    child = scopedRows[0];
    if (!child) {
      return new Response(
        JSON.stringify({ error: "Child profile not found" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  } else {
    const childRows = await db
      .select()
      .from(childProfile)
      .where(eq(childProfile.parentUserId, session.user.id))
      .limit(1);
    child = childRows[0];
    if (!child) {
      return new Response(
        JSON.stringify({ error: "No child profile found. Create one first." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // P1-1: daily screen-time limit. A child who has spent today's budget in the
  // reader can't start a fresh tale either — the gate mirrors POST
  // /api/story/page so the limit closes the whole loop, not just continuation.
  if (child.dailyMinuteLimit != null) {
    const usedSeconds = await getSecondsUsedToday(child.id);
    if (overDailyLimit(child, usedSeconds).over) {
      return new Response(
        JSON.stringify({
          error: "daily_limit_reached",
          message:
            lang === "az"
              ? "Bugünkü nağıl vaxtın bitdi! Növbəti macəra üçün sabah yenə gəl."
              : "That's today's story time all used up! Come back tomorrow for the next adventure.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // Rate-limit: free-tier users may only create a limited number of stories per week.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [storyCountRow] = await db
    .select({ value: count() })
    .from(story)
    .where(
      and(
        eq(story.childProfileId, child.id),
        gte(story.createdAt, sevenDaysAgo),
      ),
    );

  if (storyCountRow && storyCountRow.value >= FREE_TIER_WEEKLY_STORY_LIMIT) {
    return new Response(
      JSON.stringify({
        error: "rate_limited",
        message:
          "You\u2019ve already started a story this week! Come back next week for a new adventure, or continue your current story.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  // Layer 1 moderation — the child's free-text hero name + problem are the
  // first thing the LLM sees on the opener page, and the opener carries no
  // "action" text, so this is the ONLY place this input is pre-moderated.
  // Gate it here, BEFORE a draft exists, so unsafe openers never reach the
  // model. (No promptLog row: it FKs to a story that doesn't exist yet.)
  const openerInput = `${heroName}\n${problem}`.trim();
  const inputVerdict = await moderatePrompt(openerInput, lang);
  if (inputVerdict.action === "blocked") {
    return new Response(
      JSON.stringify({
        redirect: true,
        message:
          lang === "az"
            ? "Gəl bu nağıla başqa bir fikirlə başlayaq — qəhrəmanımız hansı çətinliklə üzləşsin?"
            : "Let’s start this tale with a different idea — what challenge could our hero face?",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Insert the new story as a draft.
  const rows = await db
    .insert(story)
    .values({
      childProfileId: child.id,
      title: heroName,
      worldKey,
      heroName,
      problemText: problem,
      status: "draft",
      wordCount: 0,
      chapterCount: 1,
    })
    .returning({ id: story.id });

  const newStory = rows[0];
  if (!newStory) {
    return new Response(JSON.stringify({ error: "Failed to create story" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ storyId: newStory.id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
