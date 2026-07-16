/**
 * One-off backfill for story.word_count / story.chapter_count.
 *
 * Before the fix in src/app/api/story/page/route.ts, page generation never
 * updated the parent story row, so every non-remix story sits at
 * word_count=0 / chapter_count=1 regardless of its pages. This script
 * recomputes both counters from story_page using the same tokenisation as
 * the app (whitespace-delimited words; chapters = ceil(pages / 4), min 1).
 *
 * Idempotent — rows already correct are skipped. Safe to re-run.
 *
 * Run with:
 *   node --env-file=.env scripts/backfill-story-counts.mjs --dry-run
 *   node --env-file=.env scripts/backfill-story-counts.mjs
 */

import postgres from "postgres";

const url = process.env.POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL is not set. Did you run with --env-file=.env ?");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const sql = postgres(url);

/** Same word counting as the story page + remix routes. */
const countWords = (text) =>
  (text ?? "").trim().split(/\s+/).filter(Boolean).length;

const PAGES_PER_CHAPTER = 4; // PREMIUM_PAGE_INTERVAL in page/route.ts

try {
  const pages = await sql`
    select story_id, ai_content, child_content from story_page
  `;

  const byStory = new Map();
  for (const p of pages) {
    const agg = byStory.get(p.story_id) ?? { words: 0, pages: 0 };
    agg.words += countWords(p.ai_content) + countWords(p.child_content);
    agg.pages += 1;
    byStory.set(p.story_id, agg);
  }

  const stories = await sql`
    select id, title, word_count, chapter_count from story
  `;

  let updated = 0;
  for (const s of stories) {
    const agg = byStory.get(s.id) ?? { words: 0, pages: 0 };
    const chapters = Math.max(1, Math.ceil(agg.pages / PAGES_PER_CHAPTER));
    if (s.word_count === agg.words && s.chapter_count === chapters) continue;

    console.log(
      `${dryRun ? "[dry-run] " : ""}${s.id} "${s.title}": ` +
        `word_count ${s.word_count} -> ${agg.words}, ` +
        `chapter_count ${s.chapter_count} -> ${chapters} (${agg.pages} pages)`,
    );

    if (!dryRun) {
      await sql`
        update story
        set word_count = ${agg.words},
            chapter_count = ${chapters},
            updated_at = now()
        where id = ${s.id}
      `;
    }
    updated += 1;
  }

  console.log(
    `${dryRun ? "Would update" : "Updated"} ${updated} of ${stories.length} stories.`,
  );
} finally {
  await sql.end();
}
