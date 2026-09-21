import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { buildScenePrompt, sceneHash } from "@/lib/image-prompts";
import { moderateImage } from "@/lib/moderation";
import {
  childProfile,
  moderationEvent,
  story,
  storyImage,
  storyPage,
} from "@/lib/schema";
import { upload } from "@/lib/storage";
import { overDailyLimit } from "@/lib/usage";
import { getSecondsUsedToday } from "@/lib/usage-db";

// Pages to illustrate (1-indexed page numbers, per PRD §8: pages 1/3/5/7/8).
const ILLUSTRATED_PAGES = [1, 3, 5, 7, 8] as const;

interface OpenRouterImageResponse {
  data: Array<{ b64_json: string }>;
}

// Image generation can be slow; cap it so a hung upstream call cannot exhaust
// the serverless function's execution budget.
const IMAGE_API_TIMEOUT_MS = 60_000;

async function callImageAPI(
  prompt: string,
  model: string,
  apiKey: string,
): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_API_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/images/generations", {
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
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Image API request timed out after ${IMAGE_API_TIMEOUT_MS}ms`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

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
      childProfileId: childProfile.id,
      dailyMinuteLimit: childProfile.dailyMinuteLimit,
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
  if (!z.string().uuid().safeParse(storyId).success) {
    return Response.json({ error: "Invalid story id" }, { status: 400 });
  }
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
  if (!z.string().uuid().safeParse(storyId).success) {
    return Response.json({ error: "Invalid story id" }, { status: 400 });
  }
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

  // Cost/abuse guard: illustration is a paid upstream call, so a child who has
  // spent today's screen-time budget can't keep triggering generations. Mirrors
  // the gate on the story-generation routes.
  if (storyRow.dailyMinuteLimit != null) {
    const usedSeconds = await getSecondsUsedToday(storyRow.childProfileId);
    if (overDailyLimit(storyRow, usedSeconds).over) {
      return Response.json(
        { error: "daily_limit_reached" },
        { status: 429 },
      );
    }
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
  const failures: number[] = [];
  let blocked = 0;

  // Link an image URL to THIS page. `onConflictDoNothing` on the per-page
  // unique index makes re-runs idempotent.
  async function linkImageToPage(
    storyPageId: string,
    url: string,
    hash: string,
  ) {
    await db
      .insert(storyImage)
      .values({ storyPageId, url, sceneHash: hash, modelUsed: model })
      .onConflictDoNothing({ target: storyImage.storyPageId });
  }

  for (const page of pages) {
    // Per-page isolation: one page's upstream failure must not 500 the whole
    // batch and discard the pages that already succeeded.
    try {
      const prompt = buildScenePrompt(
        page.aiContent,
        storyRow.heroName,
        storyRow.worldKey,
      );
      const hash = sceneHash(prompt);

      // Cache hit — reuse the existing (already-moderated) image without
      // calling the API again, but STILL link a row to this page so GET
      // returns it after reload even on a cross-story cache hit.
      const [cached] = await db
        .select({ url: storyImage.url })
        .from(storyImage)
        .where(eq(storyImage.sceneHash, hash))
        .limit(1);

      if (cached) {
        await linkImageToPage(page.id, cached.url, hash);
        results.push({ pageNumber: page.pageNumber, url: cached.url });
        continue;
      }

      // Cache miss — generate, then screen the pixels BEFORE they are uploaded
      // or shown to a child. A benign prompt can still yield an unsafe image.
      const imageBuffer = await callImageAPI(prompt, model, apiKey);

      const verdict = await moderateImage(imageBuffer, "en");
      if (verdict.status === "flagged") {
        // Record the block for the Layer 4 review trail and drop the bytes —
        // nothing unscreened is ever persisted or returned.
        await db.insert(moderationEvent).values({
          storyId,
          flaggedContent: `[generated illustration for page ${page.pageNumber} — image withheld]`,
          reason: verdict.reason ?? "image moderation flag",
          severity: verdict.severity ?? "medium",
          actionTaken: "image_blocked",
          reviewedByHuman: false,
        });
        blocked += 1;
        continue;
      }

      const filename = `${storyId}-p${page.pageNumber}-${hash.slice(0, 8)}.png`;
      const stored = await upload(imageBuffer, filename, "story-images", {
        maxSize: 10 * 1024 * 1024,
      });

      await linkImageToPage(page.id, stored.url, hash);
      results.push({ pageNumber: page.pageNumber, url: stored.url });
    } catch (err) {
      console.error(
        `[story/images] generation failed for page ${page.pageNumber}`,
        err,
      );
      failures.push(page.pageNumber);
    }
  }

  return Response.json({ images: results, blocked, failures });
}
