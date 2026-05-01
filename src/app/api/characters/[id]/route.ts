import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { character, childProfile } from "@/lib/schema";

const patchBodySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().min(1).max(500).optional(),
});

async function verifyCharacterOwnership(
  characterId: string,
  parentUserId: string,
) {
  const rows = await db
    .select({
      character: character,
      parentUserId: childProfile.parentUserId,
    })
    .from(character)
    .innerJoin(childProfile, eq(character.childProfileId, childProfile.id))
    .where(
      and(
        eq(character.id, characterId),
        eq(childProfile.parentUserId, parentUserId)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = await params;

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

  const owned = await verifyCharacterOwnership(id, session.user.id);
  if (!owned) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify(owned.character), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [updated] = await db
    .update(character)
    .set(updates)
    .where(eq(character.id, id))
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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = await params;

  const owned = await verifyCharacterOwnership(id, session.user.id);
  if (!owned) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  await db.delete(character).where(eq(character.id, id));

  return new Response(null, { status: 204 });
}
