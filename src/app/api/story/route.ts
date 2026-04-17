import { headers } from "next/headers";
import { and, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { childProfile, story } from "@/lib/schema";
import { getWorld } from "@/lib/worlds";

/** Maximum stories a free-tier child profile may create within a rolling 7-day window. */
const FREE_TIER_WEEKLY_STORY_LIMIT = 1;

const bodySchema = z.object({
  heroName: z.string().min(1).max(100),
  worldKey: z.string().min(1).max(100),
  problem: z.string().min(1).max(2000),
  lang: z.enum(["en", "az"]),
});

export async function POST(req: Request) {
  // Verify parent session (mirrors src/app/api/chat/route.ts).
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

  const { heroName, worldKey, problem } = parsed.data;

  // Validate that the selected world exists in the static manifest.
  const world = getWorld(worldKey);
  if (!world) {
    return new Response(JSON.stringify({ error: "Unknown world" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Phase 1 simplification: use the first child profile belonging to this parent.
  const childRows = await db
    .select()
    .from(childProfile)
    .where(eq(childProfile.parentUserId, session.user.id))
    .limit(1);

  const child = childRows[0];
  if (!child) {
    return new Response(
      JSON.stringify({ error: "No child profile found. Create one first." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
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
