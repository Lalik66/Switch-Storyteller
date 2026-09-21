import { headers } from "next/headers";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { extractAndUpsertCharacters } from "@/lib/character-extraction";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { moderatePrompt, moderateOutput } from "@/lib/moderation";
import {
  story,
  storyPage,
  promptLog,
  moderationEvent,
  childProfile,
  character,
} from "@/lib/schema";
import {
  STORY_SYSTEM_PROMPT,
  STORY_PAGE_USER_PROMPT,
  STORY_OPENER_PROMPT,
} from "@/lib/story-prompts";
import { classifyStreamError } from "@/lib/stream-errors";
import { overDailyLimit } from "@/lib/usage";
import { getSecondsUsedToday } from "@/lib/usage-db";

// Canned safe fallback content when moderation repeatedly flags output.
const CANNED_SAFE_PAGE: Record<"en" | "az", string> = {
  en: "Our hero paused to catch their breath and think kind thoughts. A friendly breeze whispered that the next part of the adventure was just around the corner. What would you like to try next?",
  az: "Qəhrəmanımız bir anlıq dayanıb nəfəs aldı və xoş fikirlər düşündü. Dostcasına bir meh növbəti macəranın lap yaxınlıqda olduğunu pıçıldadı. Növbəti addımda nə etmək istərdin?",
};

const bodySchema = z.object({
  storyId: z.string().min(1),
  chosenActionKey: z.string().max(128).optional(),
  customAction: z.string().max(1000).optional(),
  lang: z.enum(["en", "az"]),
});

// Chapters are ~4 pages; opener/finale gets the premium model.
const PREMIUM_PAGE_INTERVAL = 4;

/** Whitespace-delimited word count — same tokenisation as the remix route. */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function pickModel(nextPageNumber: number, totalPagesPlanned = 8): string {
  const isOpenerOrFinale =
    nextPageNumber === 1 ||
    nextPageNumber === totalPagesPlanned ||
    nextPageNumber % PREMIUM_PAGE_INTERVAL === 1;

  const env = getServerEnv();
  const premium = env.OPENROUTER_STORY_MODEL_PREMIUM;
  const cheap = env.OPENROUTER_STORY_MODEL_CHEAP;

  if (isOpenerOrFinale) return premium;
  return cheap;
}

export async function POST(req: Request) {
  // Verify parent session.
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { storyId, chosenActionKey, customAction, lang } = parsed.data;

  // Load the story and verify ownership via the child profile -> parent user chain.
  const storyRows = await db
    .select()
    .from(story)
    .where(eq(story.id, storyId))
    .limit(1);
  const storyRow = storyRows[0];
  if (!storyRow) {
    return new Response(JSON.stringify({ error: "Story not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const childRows = await db
    .select()
    .from(childProfile)
    .where(eq(childProfile.id, storyRow.childProfileId))
    .limit(1);
  const child = childRows[0];
  if (!child || child.parentUserId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Phase 3: refuse to continue a story that is no longer a draft. The
  // reader UI already hides the continue surface when status != 'draft',
  // but the API enforces the same gate so direct API hits can't bypass it.
  if (storyRow.status !== "draft") {
    return new Response(
      JSON.stringify({
        error: "story_not_draft",
        message:
          "This tale is sealed. Unpublish it first if you want to keep writing.",
        currentStatus: storyRow.status,
      }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  // P1-1: daily screen-time limit. Enforced here (not just shown in the UI) so
  // the co-writing loop actually stops when the day's budget is spent. Checked
  // before any model work so an over-limit child never triggers a paid call.
  if (child.dailyMinuteLimit != null) {
    const usedSeconds = await getSecondsUsedToday(child.id);
    if (overDailyLimit(child, usedSeconds).over) {
      return new Response(
        JSON.stringify({
          error: "daily_limit_reached",
          message:
            lang === "az"
              ? "Bugünkü nağıl vaxtın bitdi! Növbəti macəra üçün sabah yenə gəl."
              : "That's today's story time all used up! Come back tomorrow for the next adventure.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // Layer 1 moderation — pre-prompt on any user-authored text.
  const userInput = (customAction ?? chosenActionKey ?? "").trim();
  if (userInput.length > 0) {
    const inputVerdict = await moderatePrompt(userInput, lang);
    await db.insert(promptLog).values({
      storyId,
      originalPrompt: userInput,
      moderatedPrompt: userInput,
      moderationAction: inputVerdict.action,
    });

    if (inputVerdict.action === "blocked") {
      // Kid-friendly redirect — NOT an error; the child should feel safe.
      return new Response(
        JSON.stringify({
          redirect: true,
          message:
            lang === "az"
              ? "Gəl bu macəranı başqa cür davam etdirək — daha nəyə cəhd etmək istərdin?"
              : "Let's try a different twist for this adventure — what else could our hero try?",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Count existing pages to decide opener vs. mid vs. finale prompt + model tier.
  const existingPages = await db
    .select()
    .from(storyPage)
    .where(eq(storyPage.storyId, storyId));
  const nextPageNumber = existingPages.length + 1;
  const isOpener = nextPageNumber === 1;

  const apiKey = getServerEnv().OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OpenRouter API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const openrouter = createOpenRouter({ apiKey });
  const modelId = pickModel(nextPageNumber);

  // Compose the user-facing prompt. The prompt builder lives in story-prompts.ts.
  // We use `worldKey` as the `setting` identifier — the full localized world
  // copy is resolved inside the prompt builder from `src/lib/worlds.ts`.
  const chapterNumber = Math.max(
    1,
    Math.ceil(nextPageNumber / PREMIUM_PAGE_INTERVAL)
  );

  const orderedPages = [...existingPages]
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((p) => p.aiContent);

  const userPrompt = isOpener
    ? STORY_OPENER_PROMPT({
        lang,
        heroName: storyRow.heroName,
        setting: storyRow.worldKey,
        problem: storyRow.problemText,
        chapterNumber,
      })
    : STORY_PAGE_USER_PROMPT({
        heroName: storyRow.heroName,
        setting: storyRow.worldKey,
        problem: storyRow.problemText,
        previousPages: orderedPages,
        ...(chosenActionKey !== undefined && { chosenAction: chosenActionKey }),
        ...(customAction !== undefined && { customAction }),
      });

  // Phase 2: query the Character Vault for this child's known characters.
  // Top 10 by appearance count keeps prompt size bounded.
  const knownChars = await db
    .select({ name: character.name, description: character.description })
    .from(character)
    .where(eq(character.childProfileId, child.id))
    .orderBy(sql`${character.appearanceCount} desc`)
    .limit(10);

  const systemPrompt = STORY_SYSTEM_PROMPT(
    lang,
    child.age,
    child.contentStrictness,
    knownChars.length > 0 ? knownChars : undefined,
  );

  // Generate → moderate → reveal. Nothing reaches the child until it has
  // cleared Layer 3, so unsafe model output is NEVER shown live. The route
  // returns the finished, safe page as JSON and the client types it out for a
  // live feel (buffered reveal). This is the deliberate replacement for the
  // old stream-then-moderate-in-onFinish design, which let raw output render
  // before moderation ran.
  async function generatePage(): Promise<{ text: string; usage: unknown }> {
    const gen = await generateText({
      model: openrouter(modelId),
      system: systemPrompt,
      prompt: userPrompt,
      // Cost guard: each page targets ~150 words of prose plus a 3-line choice
      // block. English tokenizes at ~1.3 tokens/word, but Azerbaijani (with
      // ə/ş/ç/ğ/ı/ö/ü) runs ~3x heavier — a flat 400 truncated AZ pages mid
      // choice-block. Budget per-language so neither language gets cut off.
      maxOutputTokens: lang === "az" ? 1200 : 500,
    });
    return { text: gen.text, usage: gen.usage as unknown };
  }

  try {
    let { text: finalText, usage } = await generatePage();
    let lastVerdict = await moderateOutput(finalText, lang);

    // Retry up to 2 times on a flag before falling back to the canned safe page.
    let attempts = 0;
    while (lastVerdict.status === "flagged" && attempts < 2) {
      attempts += 1;
      const retry = await generatePage();
      finalText = retry.text;
      usage = retry.usage;
      lastVerdict = await moderateOutput(finalText, lang);
    }

    let moderationStatus: "safe" | "flagged" = "safe";
    if (lastVerdict.status === "flagged") {
      // Record what was flagged for the Layer 4 human-review trail, THEN
      // replace the page the child actually receives with the canned fallback.
      await db.insert(moderationEvent).values({
        storyId,
        flaggedContent: finalText,
        reason: lastVerdict.reason ?? "post-generation moderation flag",
        severity: lastVerdict.severity ?? "medium",
        actionTaken: "canned_fallback",
        reviewedByHuman: false,
      });
      finalText = CANNED_SAFE_PAGE[lang];
      moderationStatus = "flagged";
    }

    await db.insert(storyPage).values({
      storyId,
      pageNumber: nextPageNumber,
      aiContent: finalText,
      childContent: customAction ?? null,
      chosenActionKey: chosenActionKey ?? null,
      moderationStatus,
      modelUsed: modelId,
      tokenUsage: usage ? JSON.parse(JSON.stringify(usage)) : null,
    });

    // Keep the story's aggregate counters in sync (PRD P1-4 progress
    // tracking; badges, parent dashboard, and the weekly digest all
    // read story.word_count). Recompute from all pages rather than
    // incrementing so the row self-heals if a past write was missed.
    const allPages = await db
      .select({
        aiContent: storyPage.aiContent,
        childContent: storyPage.childContent,
      })
      .from(storyPage)
      .where(eq(storyPage.storyId, storyId));

    const totalWords = allPages.reduce(
      (sum, p) =>
        sum + countWords(p.aiContent) + countWords(p.childContent ?? ""),
      0,
    );

    await db
      .update(story)
      .set({
        wordCount: totalWords,
        // Chapters are ~4 pages (see PREMIUM_PAGE_INTERVAL) — same
        // bucketing as the chapterNumber prompt arg above.
        chapterCount: Math.max(
          1,
          Math.ceil(allPages.length / PREMIUM_PAGE_INTERVAL),
        ),
      })
      .where(eq(story.id, storyId));

    // Phase 2: extract characters from the safe page (fire-and-forget).
    if (moderationStatus === "safe") {
      extractAndUpsertCharacters(finalText, child.id, storyRow.heroName).catch(
        (e) => console.error("[story/page] character extraction error", e),
      );
    }

    // Only safe text ever leaves the server.
    return new Response(
      JSON.stringify({
        page: {
          pageNumber: nextPageNumber,
          aiContent: finalText,
          moderationStatus,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    // S3 (fail-closed): generation OR moderation threw. We NEVER return raw
    // text (it may be unverified), and we NEVER drop the failure silently —
    // log it, record a durable moderation event for the review trail, and hand
    // the child a classified code the client renders as gentle, translated
    // copy. classifyStreamError keeps any provider message off the wire.
    const errorClass = classifyStreamError(err);
    console.error("[story/page] generation/moderation error", {
      storyId,
      pageNumber: nextPageNumber,
      model: modelId,
      errorClass,
      providerMessage: err instanceof Error ? err.message : String(err),
    });

    try {
      await db.insert(moderationEvent).values({
        storyId,
        flaggedContent:
          "[no page produced — generation or moderation failed before Layer 3 could clear it]",
        reason: (err instanceof Error ? err.message : String(err)).slice(0, 500),
        severity: "high",
        actionTaken: "moderation_error",
        reviewedByHuman: false,
      });
    } catch (logErr) {
      console.error(
        "[story/page] failed to record moderation_error event",
        logErr,
      );
    }

    return new Response(JSON.stringify({ error: errorClass }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
