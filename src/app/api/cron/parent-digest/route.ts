import { timingSafeEqual } from "crypto";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { ParentDigestEmail } from "@/emails/parent-digest";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import {
  buildParentDigest,
  persistDigest,
  markDigestSent,
} from "@/lib/parent-report";
import { user } from "@/lib/schema";

export const dynamic = "force-dynamic";

/** Constant-time string compare that never throws on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function GET(req: Request) {
  const env = getServerEnv();

  // Auth. This endpoint walks the entire user table and emails each family
  // their child's activity (PII), so it must never run unauthenticated outside
  // a local dev box that has deliberately left CRON_SECRET unset. Gating on
  // NODE_ENV alone was unsafe: a misconfigured preview/staging (NODE_ENV not
  // exactly "production") with a live RESEND_API_KEY became an open mass-mailer.
  const isLocalDev = env.NODE_ENV === "development";
  if (!isLocalDev || env.CRON_SECRET) {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!env.CRON_SECRET || !safeEqual(authHeader, `Bearer ${env.CRON_SECRET}`)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (!env.RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const resend = new Resend(env.RESEND_API_KEY);

  // Page through users in fixed-size batches so the digest job never loads the
  // entire user table into memory at once (every user is a potential parent).
  const BATCH_SIZE = 200;

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let offset = 0; ; offset += BATCH_SIZE) {
    const parents = await db
      .select()
      .from(user)
      .orderBy(user.id)
      .limit(BATCH_SIZE)
      .offset(offset);

    if (parents.length === 0) break;

    for (const parent of parents) {
      try {
      const digest = await buildParentDigest(
        parent.id,
        parent.name ?? "Parent",
        parent.email,
      );

      // Skip parents with no children.
      if (digest.children.length === 0) {
        skipped++;
        continue;
      }

      // Skip if all children had zero activity this week.
      const hasActivity = digest.children.some(
        (c) => c.storiesCreated > 0 || c.totalWordsWritten > 0,
      );
      if (!hasActivity) {
        skipped++;
        continue;
      }

      // Persist the report rows.
      await persistDigest(digest, parent.id);

      // Render and send the email.
      const weekEndingStr = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(digest.weekEnding);

      const html = await render(
        ParentDigestEmail({
          parentName: parent.name?.split(" ")[0] ?? "Parent",
          weekEnding: weekEndingStr,
          children: digest.children,
        }),
      );

      await resend.emails.send({
        // Resend-verified sending domain is mail.herosforge.app — the
        // bare apex is not verified and 403s.
        from: "The Hero's Forge <digest@mail.herosforge.app>",
        to: parent.email,
        subject: `Weekly Digest — ${weekEndingStr}`,
        html,
      });

      await markDigestSent(parent.id, digest.weekEnding);
      sent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${parent.email}: ${msg}`);
        console.error(`[parent-digest] failed for ${parent.email}`, err);
      }
    }
  }

  return new Response(
    JSON.stringify({
      sent,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
