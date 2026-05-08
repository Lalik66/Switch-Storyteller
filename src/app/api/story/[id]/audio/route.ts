import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { audioHash, synthesize } from "@/lib/audio";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { childProfile, story, storyAudio, storyPage } from "@/lib/schema";
import { upload } from "@/lib/storage";

async function resolveStory(storyId: string, parentUserId: string) {
  const [row] = await db
    .select({ id: story.id })
    .from(story)
    .innerJoin(childProfile, eq(story.childProfileId, childProfile.id))
    .where(
      and(
        eq(story.id, storyId),
        eq(childProfile.parentUserId, parentUserId),
      ),
    )
    .limit(1);
  return row ?? null;
}

// ---------------------------------------------------------------------------
// GET /api/story/[id]/audio — list cached narrations for a story
// ---------------------------------------------------------------------------

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: storyId } = await params;
  const storyRow = await resolveStory(storyId, session.user.id);
  if (!storyRow) {
    return Response.json({ error: "Story not found" }, { status: 404 });
  }

  const tracks = await db
    .select({
      pageNumber: storyPage.pageNumber,
      url: storyAudio.url,
    })
    .from(storyAudio)
    .innerJoin(storyPage, eq(storyAudio.storyPageId, storyPage.id))
    .where(eq(storyPage.storyId, storyId));

  return Response.json({ tracks });
}

// ---------------------------------------------------------------------------
// POST /api/story/[id]/audio — synthesise narration for one or all pages
// ---------------------------------------------------------------------------

const postBodySchema = z
  .object({
    pageNumber: z.number().int().positive().optional(),
  })
  .strict();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: storyId } = await params;
  const env = getServerEnv();

  if (!env.ELEVENLABS_API_KEY) {
    return Response.json(
      { error: "Audio narration is not configured (missing ELEVENLABS_API_KEY)" },
      { status: 503 },
    );
  }

  const storyRow = await resolveStory(storyId, session.user.id);
  if (!storyRow) {
    return Response.json({ error: "Story not found" }, { status: 404 });
  }

  const rawBody = await req.json().catch(() => ({}));
  const parsed = postBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { pageNumber } = parsed.data;

  const pages = await db
    .select({
      id: storyPage.id,
      pageNumber: storyPage.pageNumber,
      aiContent: storyPage.aiContent,
    })
    .from(storyPage)
    .where(
      pageNumber === undefined
        ? eq(storyPage.storyId, storyId)
        : and(
            eq(storyPage.storyId, storyId),
            eq(storyPage.pageNumber, pageNumber),
          ),
    );

  if (pages.length === 0) {
    return Response.json(
      { error: "No pages found to narrate" },
      { status: 400 },
    );
  }

  const voiceId = env.ELEVENLABS_VOICE_ID;
  const modelId = env.ELEVENLABS_MODEL_ID;
  const apiKey = env.ELEVENLABS_API_KEY;
  const tracks: Array<{ pageNumber: number; url: string }> = [];

  for (const page of pages) {
    const hash = audioHash(page.aiContent, voiceId, modelId);

    const [cached] = await db
      .select({ url: storyAudio.url })
      .from(storyAudio)
      .where(eq(storyAudio.audioHash, hash))
      .limit(1);

    if (cached) {
      tracks.push({ pageNumber: page.pageNumber, url: cached.url });
      continue;
    }

    const audioBuffer = await synthesize(page.aiContent, voiceId, modelId, apiKey);

    const filename = `${storyId}-p${page.pageNumber}-${hash.slice(0, 8)}.mp3`;
    const stored = await upload(audioBuffer, filename, "story-audio", {
      maxSize: 10 * 1024 * 1024,
    });

    await db.insert(storyAudio).values({
      storyPageId: page.id,
      url: stored.url,
      audioHash: hash,
      voiceId,
      modelUsed: modelId,
    });

    tracks.push({ pageNumber: page.pageNumber, url: stored.url });
  }

  return Response.json({ tracks });
}
