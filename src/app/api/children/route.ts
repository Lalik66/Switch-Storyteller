import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { childProfile } from "@/lib/schema";

const createBodySchema = z.object({
  displayName: z.string().min(1).max(40),
  age: z.number().int().min(3).max(17),
  contentStrictness: z.enum(["standard", "strict"]).optional(),
  allowPublish: z.boolean().optional(),
  allowRemix: z.boolean().optional(),
  dailyMinuteLimit: z.number().int().min(0).max(600).nullable().optional(),
});

export async function GET() {
  // Verify parent session (mirrors src/app/api/chat/route.ts).
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = await db
    .select()
    .from(childProfile)
    .where(eq(childProfile.parentUserId, session.user.id));

  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

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

  const { displayName, age, contentStrictness, allowPublish, allowRemix, dailyMinuteLimit } =
    parsed.data;

  const [newChild] = await db
    .insert(childProfile)
    .values({
      parentUserId: session.user.id,
      displayName,
      age,
      ...(contentStrictness !== undefined && { contentStrictness }),
      ...(allowPublish !== undefined && { allowPublish }),
      ...(allowRemix !== undefined && { allowRemix }),
      ...(dailyMinuteLimit !== undefined && { dailyMinuteLimit }),
    })
    .returning();

  return new Response(JSON.stringify(newChild), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
