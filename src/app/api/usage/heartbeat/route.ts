import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { childProfile, story } from "@/lib/schema";
import { overDailyLimit } from "@/lib/usage";
import { creditHeartbeat } from "@/lib/usage-db";

/**
 * P1-1 — reader heartbeat. The story reader posts here on an interval while the
 * child is actively co-writing (tab visible). Each beat credits the elapsed,
 * server-clamped time to today's usage row and reports the running total so the
 * client can react without a reload.
 *
 * Time is measured server-side (never trusts a client-reported duration), so a
 * tampered or replayed request cannot inflate or shrink the count.
 */

const bodySchema = z.object({
  storyId: z.string().uuid(),
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
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Resolve the child via the story → child → parent chain, and verify
  // ownership — same walk as POST /api/story/page.
  const [storyRow] = await db
    .select({ childProfileId: story.childProfileId })
    .from(story)
    .where(eq(story.id, parsed.data.storyId))
    .limit(1);
  if (!storyRow) {
    return new Response(JSON.stringify({ error: "Story not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [child] = await db
    .select({
      id: childProfile.id,
      parentUserId: childProfile.parentUserId,
      dailyMinuteLimit: childProfile.dailyMinuteLimit,
    })
    .from(childProfile)
    .where(eq(childProfile.id, storyRow.childProfileId))
    .limit(1);
  if (!child || child.parentUserId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const usedSeconds = await creditHeartbeat(child.id);
  const { over, limitSeconds } = overDailyLimit(child, usedSeconds);

  return new Response(
    JSON.stringify({ usedSeconds, limitSeconds, over }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
