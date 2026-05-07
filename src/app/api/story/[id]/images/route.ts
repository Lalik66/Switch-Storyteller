import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { buildScenePrompt, sceneHash } from "@/lib/image-prompts";
import { childProfile, story, storyImage, storyPage } from "@/lib/schema";
import { upload } from "@/lib/storage";

// Pages to illustrate (1-indexed page numbers, per PRD §8: pages 1/3/5/7/8).
const ILLUSTRATED_PAGES = [1, 3, 5, 7, 8] as const;

interface OpenRouterImageResponse {
  data: Array<{ b64_json: string }>;
}

async function callImageAPI(
  prompt: string,
  model: string,
  apiKey: string,
): Promise<Buffer> {
  const res = await fetch("https://openrouter.ai/api/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`Image API ${res.status}: ${text}`);
  }

  const json = (await res.json()) as OpenRouterImageResponse;
  const b64 = json.data[0]?.b64_json;
  if (!b64) throw new Error("Image API returned no image data");
  return Buffer.from(b64, "base64");
}

async function resolveStory(storyId: string, parentUserId: string) {
  const [row] = await db
    .select({
      id: story.id,
      heroName: story.heroName,
      worldKey: story.worldKey,
    })
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
// GET /api/story/[id]/images — return already-generated images for a story
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

  const images = await db
    .select({
      pageNumber: storyPage.pageNumber,
      url: storyImage.url,
    })
    .from(storyImage)
    .innerJoin(storyPage, eq(storyImage.storyPageId, storyPage.id))
    .where(eq(storyPage.storyId, storyId));

  return Response.json({ images });
}

// ---------------------------------------------------------------------------
// POST /api/story/[id]/images — generate (or reuse cached) illustrations
// ---------------------------------------------------------------------------

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: storyId } = await params;
  const env = getServerEnv();

  if (!env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "Image generation is not configured (missing OPENROUTER_API_KEY)" },
      { status: 503 },
    );
  }

  const storyRow = await resolveStory(storyId, session.user.id);
  if (!storyRow) {
    return Response.json({ error: "Story not found" }, { status: 404 });
  }

  // Fetch only the target pages (1/3/5/7/8).
  const pages = await db
    .select({
      id: storyPage.id,
      pageNumber: storyPage.pageNumber,
      aiContent: storyPage.aiContent,
    })
    .from(storyPage)
    .where(
      and(
        eq(storyPage.storyId, storyId),
        inArray(storyPage.pageNumber, [...ILLUSTRATED_PAGES]),
      ),
    );

  if (pages.length === 0) {
    return Response.json(
      { error: "No illustratable pages found (need pages 1, 3, 5, 7, or 8)" },
      { status: 400 },
    );
  }

  const model = env.OPENROUTER_IMAGE_MODEL;
  const apiKey = env.OPENROUTER_API_KEY;
  const results: Array<{ pageNumber: number; url: string }> = [];

  for (const page of pages) {
    const prompt = buildScenePrompt(
      page.aiContent,
      storyRow.heroName,
      storyRow.worldKey,
    );
    const hash = sceneHash(prompt);

    // Cache hit — reuse existing image without calling the API again.
    const [cached] = await db
      .select({ url: storyImage.url })
      .from(storyImage)
      .where(eq(storyImage.sceneHash, hash))
      .limit(1);

    if (cached) {
      results.push({ pageNumber: page.pageNumber, url: cached.url });
      continue;
    }

    // Cache miss — generate, upload, and persist.
    const imageBuffer = await callImageAPI(prompt, model, apiKey);

    const filename = `${storyId}-p${page.pageNumber}-${hash.slice(0, 8)}.png`;
    const stored = await upload(imageBuffer, filename, "story-images", {
      maxSize: 10 * 1024 * 1024,
    });

    await db.insert(storyImage).values({
      storyPageId: page.id,
      url: stored.url,
      sceneHash: hash,
      modelUsed: model,
    });

    results.push({ pageNumber: page.pageNumber, url: stored.url });
  }

  return Response.json({ images: results });
}
