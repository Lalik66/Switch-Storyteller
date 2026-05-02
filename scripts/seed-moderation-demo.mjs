/**
 * Seed script for Phase 4 (admin moderation queue) E2E walk-through.
 *
 * Idempotent. Safe to re-run — it upserts the admin role on the named
 * email and skips event seeding if the queue already has demo rows.
 *
 * What it does:
 *   1. Verifies the target user exists in the `user` table.
 *   2. Sets that user's role to 'admin'.
 *   3. Locates an existing story (any owned by any of the admin's
 *      child profiles) — falls back to the most recent story in the
 *      DB if the admin has none, so the queue has something to link to.
 *   4. Inserts five moderation_event rows across all severity buckets
 *      and review states, tagged with the marker text so re-runs are
 *      detectable and don't duplicate.
 *
 * Run with:
 *   node --env-file=.env scripts/seed-moderation-demo.mjs you@example.com
 *
 * If no email arg is given it falls back to ADMIN_EMAIL, otherwise refuses
 * to run (we never guess who to promote).
 */

import postgres from "postgres";

const SEED_MARKER = "[seed:phase4-demo]";

const email = process.argv[2] || process.env.ADMIN_EMAIL;
if (!email) {
  console.error(
    "usage: node scripts/seed-moderation-demo.mjs <email>\n" +
      "       (or set ADMIN_EMAIL in env)",
  );
  process.exit(1);
}

const url = process.env.POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL is not set. Did you run with --env-file=.env ?");
  process.exit(1);
}

const sql = postgres(url, { onnotice: () => {} });

try {
  // 1. Locate user
  const [user] = await sql`
    SELECT id, email, name, role
    FROM "user"
    WHERE email = ${email}
    LIMIT 1
  `;
  if (!user) {
    console.error(`No user found with email ${email}.`);
    console.error("Sign up via the app first, then re-run this script.");
    process.exit(1);
  }
  console.log(`found user ${user.id} (${user.email})`);

  // 2. Promote
  if (user.role !== "admin") {
    await sql`UPDATE "user" SET role = 'admin' WHERE id = ${user.id}`;
    console.log(`promoted ${user.email} to admin`);
  } else {
    console.log(`${user.email} is already admin`);
  }

  // 3. Find a story to attach events to
  let [story] = await sql`
    SELECT s.id, s.title
    FROM story s
    JOIN child_profile cp ON cp.id = s.child_profile_id
    WHERE cp.parent_user_id = ${user.id}
    ORDER BY s.created_at DESC
    LIMIT 1
  `;
  if (!story) {
    [story] = await sql`
      SELECT id, title FROM story ORDER BY created_at DESC LIMIT 1
    `;
  }
  if (!story) {
    console.error(
      "No stories exist in the DB. Create at least one story via the app first.",
    );
    process.exit(1);
  }
  console.log(`attaching events to story ${story.id} (${story.title})`);

  // 4. Skip if already seeded
  const [existing] = await sql`
    SELECT COUNT(*)::int AS c
    FROM moderation_event
    WHERE reason LIKE ${"%" + SEED_MARKER + "%"}
  `;
  if (existing.c > 0) {
    console.log(
      `${existing.c} demo events already present — skipping insert.`,
    );
  } else {
    const events = [
      {
        flagged: "she fell into a really bad dream that wouldn't end",
        reason: `${SEED_MARKER} category=violence (auto)`,
        severity: "high",
        action: "regenerated",
      },
      {
        flagged: "the wolf snarled and showed its sharp white teeth",
        reason: `${SEED_MARKER} category=violence/graphic (auto)`,
        severity: "medium",
        action: "regenerated",
      },
      {
        flagged: "I hate broccoli forever and ever and EVER",
        reason: `${SEED_MARKER} category=harassment (auto)`,
        severity: "low",
        action: "allowed",
      },
      {
        flagged: "the spell tasted like burnt toast",
        reason: `${SEED_MARKER} category=harm/self (auto)`,
        severity: "medium",
        action: "regenerated",
      },
      {
        flagged: "the dragon scared everyone in the village so much",
        reason: `${SEED_MARKER} category=violence (auto)`,
        severity: "high",
        action: "blocked",
      },
    ];

    for (const e of events) {
      await sql`
        INSERT INTO moderation_event
          (story_id, flagged_content, reason, severity, action_taken)
        VALUES
          (${story.id}, ${e.flagged}, ${e.reason}, ${e.severity}, ${e.action})
      `;
    }
    console.log(`inserted ${events.length} demo moderation events`);
  }

  // 5. Echo the queue state for sanity
  const queue = await sql`
    SELECT severity, reviewed_by_human, COUNT(*)::int AS n
    FROM moderation_event
    GROUP BY severity, reviewed_by_human
    ORDER BY severity, reviewed_by_human
  `;
  console.log("\nqueue state:");
  console.table(queue);

  console.log(
    "\nready. start the dev server, log in as " +
      email +
      ", and visit /admin/moderation",
  );
} finally {
  await sql.end();
}
