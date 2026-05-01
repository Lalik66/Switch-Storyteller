import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { character, childProfile } from "@/lib/schema";

const createBodySchema = z.object({
  childProfileId: z.string().uuid(),
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(500),
});

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(req.url);
  const childProfileId = searchParams.get("childProfileId");

  if (!childProfileId) {
    return new Response(
      JSON.stringify({ error: "childProfileId query param required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Verify the child profile belongs to this parent.
  const childRows = await db
    .select()
    .from(childProfile)
    .where(
      and(
        eq(childProfile.id, childProfileId),
        eq(childProfile.parentUserId, session.user.id)
      )
    )
    .limit(1);

  if (childRows.length === 0) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = await db
    .select()
    .from(character)
    .where(eq(character.childProfileId, childProfileId))
    .orderBy(desc(character.appearanceCount));

  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
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

  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { childProfileId, name, description } = parsed.data;

  // Verify the child profile belongs to this parent.
  const childRows = await db
    .select()
    .from(childProfile)
    .where(
      and(
        eq(childProfile.id, childProfileId),
        eq(childProfile.parentUserId, session.user.id)
      )
    )
    .limit(1);

  if (childRows.length === 0) {
    return new Response(JSON.stringify({ error: "Child profile not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [created] = await db
    .insert(character)
    .values({
      childProfileId,
      name: name.trim(),
      description: description.trim(),
      appearanceCount: 0,
    })
    .returning();

  return new Response(JSON.stringify(created), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
