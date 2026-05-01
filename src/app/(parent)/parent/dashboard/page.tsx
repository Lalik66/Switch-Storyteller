import Link from "next/link";
import { desc, eq, gte, and, inArray, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  childProfile,
  story,
  storyPage,
  moderationEvent,
  character,
  parentReport,
  type ChildProfile,
} from "@/lib/schema";
import { requireAuth } from "@/lib/session";

type ChildDashboardData = {
  child: ChildProfile;
  storiesThisWeek: number;
  totalStories: number;
  totalWords: number;
  totalPages: number;
  characterCount: number;
  moderationIncidents: number;
  lastReportSentAt: Date | null;
};

function startOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

async function loadDashboardData(
  parentId: string,
): Promise<ChildDashboardData[]> {
  const children = await db
    .select()
    .from(childProfile)
    .where(eq(childProfile.parentUserId, parentId))
    .orderBy(desc(childProfile.createdAt));

  const since = startOfWeek();
  const result: ChildDashboardData[] = [];

  for (const child of children) {
    const allStories = await db
      .select({ id: story.id, wordCount: story.wordCount, createdAt: story.createdAt })
      .from(story)
      .where(eq(story.childProfileId, child.id));

    const storiesThisWeek = allStories.filter(
      (s) => s.createdAt >= since
    ).length;

    const totalWords = allStories.reduce((acc, s) => acc + (s.wordCount ?? 0), 0);

    const storyIds = allStories.map((s) => s.id);

    let totalPages = 0;
    let moderationIncidents = 0;

    if (storyIds.length > 0) {
      const [pageResult] = await db
        .select({ total: count() })
        .from(storyPage)
        .where(inArray(storyPage.storyId, storyIds));
      totalPages = pageResult?.total ?? 0;

      const [modResult] = await db
        .select({ total: count() })
        .from(moderationEvent)
        .where(
          and(
            inArray(moderationEvent.storyId, storyIds),
            gte(moderationEvent.createdAt, since),
          )
        );
      moderationIncidents = modResult?.total ?? 0;
    }

    const [charResult] = await db
      .select({ total: count() })
      .from(character)
      .where(eq(character.childProfileId, child.id));
    const characterCount = charResult?.total ?? 0;

    const lastReport = await db
      .select({ sentAt: parentReport.sentAt })
      .from(parentReport)
      .where(
        and(
          eq(parentReport.parentUserId, parentId),
          eq(parentReport.childProfileId, child.id),
        )
      )
      .orderBy(desc(parentReport.weekEnding))
      .limit(1);

    result.push({
      child,
      storiesThisWeek,
      totalStories: allStories.length,
      totalWords,
      totalPages,
      characterCount,
      moderationIncidents,
      lastReportSentAt: lastReport[0]?.sentAt ?? null,
    });
  }

  return result;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ParentDashboardPage() {
  const session = await requireAuth();
  const parentFirstName = session.user.name?.split(" ")[0] ?? "Captain";
  const data = await loadDashboardData(session.user.id);

  const totalStoriesAllChildren = data.reduce((acc, d) => acc + d.totalStories, 0);
  const totalWordsAllChildren = data.reduce((acc, d) => acc + d.totalWords, 0);
  const totalIncidentsThisWeek = data.reduce(
    (acc, d) => acc + d.moderationIncidents,
    0,
  );

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <header className="mb-16 max-w-2xl">
          <p className="eyebrow">
            &sect; The parent&rsquo;s dashboard &middot; Weekly overview
          </p>
          <h1 className="display-lg mt-4 text-4xl md:text-5xl">
            Your crew&rsquo;s{" "}
            <span className="italic-wonk text-[color:var(--ember)]">
              progress,
            </span>
            <br />
            {parentFirstName}.
          </h1>
          <p className="mt-5 font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
            A weekly reckoning of tales spun, words written, and the
            storyteller&rsquo;s safety log. Everything in one harbour.
          </p>
        </header>

        {/* ── Aggregate stats ─────────────────────────────────── */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total stories" value={totalStoriesAllChildren} />
          <StatCard
            label="Total words"
            value={totalWordsAllChildren.toLocaleString()}
          />
          <StatCard
            label="Incidents this week"
            value={totalIncidentsThisWeek}
            highlight={totalIncidentsThisWeek > 0}
          />
        </div>

        {/* ── Quick links ─────────────────────────────────────── */}
        <div className="mb-12 flex flex-wrap gap-3">
          <Link href="/parent/stories" className="btn-ghost-ink">
            Full story library
          </Link>
          <Link href="/characters" className="btn-ghost-ink">
            Character vault
          </Link>
          <Link href="/children" className="btn-ghost-ink">
            Manage children
          </Link>
        </div>

        {/* ── Per-child cards ─────────────────────────────────── */}
        {data.length === 0 ? (
          <article className="card-stamp p-10 text-center">
            <p className="eyebrow text-foreground/55">No scribes aboard yet.</p>
            <p className="mt-4 font-[var(--font-newsreader)] text-[15.5px] italic leading-relaxed text-foreground/70">
              Add your first young scribe in the{" "}
              <Link
                href="/children"
                className="border-b border-[color:var(--ember)]/60 pb-0.5 text-[color:var(--ember)] transition-colors hover:border-[color:var(--ember)]"
              >
                parent&rsquo;s room
              </Link>{" "}
              to begin tracking their progress.
            </p>
          </article>
        ) : (
          <div className="flex flex-col gap-6">
            {data.map((d) => (
              <article key={d.child.id} className="card-stamp overflow-hidden">
                <div className="px-6 py-5 md:px-8">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[color:var(--ember)] font-[var(--font-fraunces)] text-xl italic text-[color:var(--primary-foreground)]">
                      {d.child.displayName.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl leading-tight">
                        {d.child.displayName}
                      </h2>
                      <p className="eyebrow mt-1">
                        {d.child.age} years &middot;{" "}
                        {d.child.contentStrictness} mode
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/60 bg-[color:var(--card)]/50 px-6 py-5 md:px-8">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                    <DashboardStat
                      label="Stories"
                      value={d.totalStories}
                      sub={`${d.storiesThisWeek} this week`}
                    />
                    <DashboardStat
                      label="Words"
                      value={d.totalWords.toLocaleString()}
                    />
                    <DashboardStat label="Pages" value={d.totalPages} />
                    <DashboardStat
                      label="Characters"
                      value={d.characterCount}
                    />
                  </dl>

                  {d.moderationIncidents > 0 && (
                    <div className="mt-4 rounded-md border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 px-4 py-3">
                      <p className="eyebrow text-[color:var(--ember)]">
                        {d.moderationIncidents} moderation{" "}
                        {d.moderationIncidents === 1
                          ? "incident"
                          : "incidents"}{" "}
                        this week
                      </p>
                    </div>
                  )}

                  {d.lastReportSentAt && (
                    <p className="mt-3 font-[var(--font-newsreader)] text-[13px] italic text-foreground/50">
                      Last digest sent {formatDate(d.lastReportSentAt)}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <article className="card-stamp p-5">
      <p className="eyebrow">{label}</p>
      <p
        className={`mt-2 font-[var(--font-fraunces)] text-3xl italic ${
          highlight ? "text-[color:var(--ember)]" : ""
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function DashboardStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 font-[var(--font-fraunces)] text-2xl italic">
        {value}
      </dd>
      {sub && (
        <dd className="mt-0.5 font-[var(--font-newsreader)] text-[13px] italic text-foreground/55">
          {sub}
        </dd>
      )}
    </div>
  );
}
