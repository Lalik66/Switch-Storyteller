import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { character } from "@/lib/schema";

const extractionSchema = z.object({
  characters: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    })
  ),
});

/**
 * Fire-and-forget: parse named characters from an AI-generated story
 * page and upsert them into the `character` table. Uses the cheap model
 * to keep costs negligible. Failures are logged and swallowed — the
 * child never waits on this.
 */
export async function extractAndUpsertCharacters(
  pageText: string,
  childProfileId: string,
  heroName: string,
): Promise<void> {
  try {
    const env = getServerEnv();
    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) return;

    const openrouter = createOpenRouter({ apiKey });

    const { object } = await generateObject({
      model: openrouter(env.OPENROUTER_STORY_MODEL_CHEAP),
      schema: extractionSchema,
      prompt: [
        `Extract named characters from this children's story page. The hero's name is "${heroName}" — skip them, we only want supporting characters.`,
        `For each character found, give a short physical/personality description (1-2 sentences) based on what the text says or implies.`,
        `If no supporting characters appear, return an empty array.`,
        ``,
        `Story page:`,
        pageText,
      ].join("\n"),
      maxOutputTokens: 300,
    });

    for (const char of object.characters) {
      const normalizedName = char.name.trim();
      if (!normalizedName || normalizedName.toLowerCase() === heroName.toLowerCase()) {
        continue;
      }

      const existing = await db
        .select()
        .from(character)
        .where(
          and(
            eq(character.childProfileId, childProfileId),
            sql`lower(${character.name}) = lower(${normalizedName})`
          )
        )
        .limit(1);

      const current = existing[0];
      if (current) {
        const shouldUpdateDescription =
          char.description.length > (current.description?.length ?? 0);

        await db
          .update(character)
          .set({
            appearanceCount: sql`${character.appearanceCount} + 1`,
            ...(shouldUpdateDescription && { description: char.description }),
          })
          .where(eq(character.id, current.id));
      } else {
        await db.insert(character).values({
          childProfileId,
          name: normalizedName,
          description: char.description,
          appearanceCount: 1,
        });
      }
    }
  } catch (err) {
    console.error("[character-extraction] extraction failed (non-fatal)", err);
  }
}
