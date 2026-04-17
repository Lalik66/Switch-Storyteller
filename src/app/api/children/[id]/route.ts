import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { childProfile } from "@/lib/schema";

const patchBodySchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  age: z.number().int().min(3).max(17).optional(),
  contentStrictness: z.enum(["standard", "strict"]).optional(),
  allowPublish: z.boolean().optional(),
  allowRemix: z.boolean().optional(),
  dailyMinuteLimit: z.number().int().min(0).max(600).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify parent session (mirrors src/app/api/chat/route.ts).
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = await params;

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

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Verify ownership: the child profile must belong to the session user.
  const existing = await db
    .select()
    .from(childProfile)
    .where(
      and(eq(childProfile.id, id), eq(childProfile.parentUserId, session.user.id))
    )
    .limit(1);

  if (existing.length === 0) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const updates = parsed.data;

  // Only update if there is at least one field to change.
  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify(existing[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [updated] = await db
    .update(childProfile)
    .set(updates)
    .where(
      and(eq(childProfile.id, id), eq(childProfile.parentUserId, session.user.id))
    )
    .returning();

  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify parent session (mirrors src/app/api/chat/route.ts).
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = await params;

  // Verify ownership before deleting.
  const existing = await db
    .select({ id: childProfile.id })
    .from(childProfile)
    .where(
      and(eq(childProfile.id, id), eq(childProfile.parentUserId, session.user.id))
    )
    .limit(1);

  if (existing.length === 0) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  await db
    .delete(childProfile)
    .where(
      and(eq(childProfile.id, id), eq(childProfile.parentUserId, session.user.id))
    );

  return new Response(null, { status: 204 });
}
