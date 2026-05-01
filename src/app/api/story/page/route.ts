import { headers } from "next/headers";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
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

  const result = streamText({
    model: openrouter(modelId),
    system: systemPrompt,
    prompt: userPrompt,
    // Cost guard: each page targets ~150 words of prose; 400 tokens provides
    // comfortable buffer (avg English word ≈ 1.3 tokens).
    maxOutputTokens: 400,
    // Layer 3 moderation runs after the full page is generated.
    onFinish: async ({ text, usage }) => {
      try {
        let finalText = text;
        let attempts = 0;
        let lastVerdict = await moderateOutput(finalText, lang);

        // Retry up to 2 times on flag before falling back to canned safe page.
        while (lastVerdict.status === "flagged" && attempts < 2) {
          attempts += 1;
          const retry = streamText({
            model: openrouter(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            maxOutputTokens: 400, // Same cost guard as main call
          });
          // Drain retry to a full string.
          let retryText = "";
          for await (const chunk of retry.textStream) {
            retryText += chunk;
          }
          finalText = retryText;
          lastVerdict = await moderateOutput(finalText, lang);
        }

        let moderationStatus: "safe" | "flagged" = "safe";
        if (lastVerdict.status === "flagged") {
          finalText = CANNED_SAFE_PAGE[lang];
          moderationStatus = "flagged";
          await db.insert(moderationEvent).values({
            storyId,
            flaggedContent: text,
            reason: lastVerdict.reason ?? "post-generation moderation flag",
            severity: lastVerdict.severity ?? "medium",
            actionTaken: "canned_fallback",
            reviewedByHuman: false,
          });
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

        // Phase 2: extract characters from the generated page (fire-and-forget).
        if (moderationStatus === "safe") {
          extractAndUpsertCharacters(
            finalText,
            child.id,
            storyRow.heroName,
          ).catch((e) =>
            console.error("[story/page] character extraction error", e)
          );
        }
      } catch (err) {
        // Never throw from onFinish — the stream is already delivered.
        console.error("[story/page] onFinish persistence error", err);
      }
    },
  });

  return (
    result as unknown as { toUIMessageStreamResponse: () => Response }
  ).toUIMessageStreamResponse();
}
