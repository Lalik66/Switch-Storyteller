/**
 * POST /api/story/:id/complete — flip a draft story to status='complete'.
 * Owner-only. Idempotent on already-complete or already-published stories
 * (returns the current status, never errors).
 *
 * This is the "I'm done writing" affordance for the child reader. The
 * parent can then publish from `/parent/stories` (with the usual
 * gates: ≥4 pages, all moderation-safe, allowPublish=true).
 */

import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { childProfile, story } from "@/lib/schema";

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return json({ error: "Unauthorized" }, 401);

  const { id: storyId } = await params;
  if (!z.string().uuid().safeParse(storyId).success) {
    return json({ error: "Invalid story id" }, 400);
  }

  // Verify ownership in a single query.
  const rows = await db
    .select({ story })
    .from(story)
    .innerJoin(childProfile, eq(childProfile.id, story.childProfileId))
    .where(
      and(
        eq(story.id, storyId),
        eq(childProfile.parentUserId, session.user.id),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return json({ error: "Story not found" }, 404);

  // Idempotent: only flip if currently a draft. Already-complete or
  // already-published stories return their current status unchanged.
  if (row.story.status !== "draft") {
    return json({ status: row.story.status }, 200);
  }

  await db
    .update(story)
    .set({ status: "complete" })
    .where(eq(story.id, storyId));

  return json({ status: "complete" }, 200);
}
