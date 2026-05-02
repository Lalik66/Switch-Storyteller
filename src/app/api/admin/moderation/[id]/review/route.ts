/**
 * POST /api/admin/moderation/[id]/review — Layer 4 reviewer endpoint.
 *
 * Marks a single moderation_event row as reviewed by the current admin.
 * Records reviewer id, timestamp, and optional notes for audit. Idempotent:
 * a second review by the same admin updates the notes/timestamp; a review
 * by a different admin overwrites the reviewer (we do not keep a history
 * of reviewers per event in v1 — PRD §10 calls for an audit trail, not a
 * reviewer-changelog, and the simpler shape ships now).
 *
 * Access control: re-checks `requireAdmin()` rather than trusting a route
 * group layout, because route handlers do not run inside the (admin)
 * layout. Belt and braces.
 */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { moderationEvent } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";

const bodySchema = z
  .object({
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // requireAdmin() either returns the session (admin role) or calls
  // redirect()/throws — for an API route we want a clean 401/403 instead
  // of a redirect HTML response, so we guard manually.
  let session: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    session = await requireAdmin();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const rawBody = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const now = new Date();
  const [updated] = await db
    .update(moderationEvent)
    .set({
      reviewedByHuman: true,
      reviewedBy: session.user.id,
      reviewedAt: now,
      reviewerNotes: parsed.data.notes ?? null,
    })
    .where(eq(moderationEvent.id, id))
    .returning({
      id: moderationEvent.id,
      reviewedAt: moderationEvent.reviewedAt,
      reviewedBy: moderationEvent.reviewedBy,
    });

  if (!updated) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  return Response.json({ event: updated });
}
