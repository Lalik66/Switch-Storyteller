import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { sql } from "drizzle-orm";
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

      // Atomic upsert keyed on the (child_profile_id, lower(name)) unique
      // index. Two pages that finish close together can no longer both insert
      // the same character — the second collapses into an appearance-count
      // bump. The description is replaced only when the new one is longer
      // (richer), preserving the old read-modify-write intent without the race.
      // Raw SQL because the conflict target is an EXPRESSION index (lower(name)),
      // which Drizzle's typed `onConflictDoUpdate` target can't express.
      await db.execute(sql`
        INSERT INTO ${character} (child_profile_id, name, description, appearance_count)
        VALUES (${childProfileId}::uuid, ${normalizedName}, ${char.description}, 1)
        ON CONFLICT (child_profile_id, lower(name)) DO UPDATE SET
          appearance_count = ${character}.appearance_count + 1,
          description = CASE
            WHEN length(excluded.description) > length(${character}.description)
              THEN excluded.description
            ELSE ${character}.description
          END
      `);
    }
  } catch (err) {
    console.error("[character-extraction] extraction failed (non-fatal)", err);
  }
}
