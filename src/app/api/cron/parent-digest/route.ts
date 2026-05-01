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

export async function GET(req: Request) {
  const env = getServerEnv();

  // Auth: only allow Vercel Cron (via CRON_SECRET) or unauthenticated in dev.
  if (env.NODE_ENV === "production") {
    const authHeader = req.headers.get("authorization");
    if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
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

  // Load all parents (every user is a potential parent).
  const parents = await db.select().from(user);

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

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
        from: "The Hero's Forge <digest@herosforge.app>",
        to: parent.email,
        subject: `Weekly Digest — ${weekEndingStr}`,
        html,
      });

      await markDigestSent(parent.id, digest.weekEnding);
      sent++;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown error";
      errors.push(`${parent.email}: ${msg}`);
      console.error(`[parent-digest] failed for ${parent.email}`, err);
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
