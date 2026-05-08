/**
 * Community Feed — PRD §4.3 + impl-plan Phase 3.
 *
 * Server-rendered, paginated feed of published stories. Every entry must
 * satisfy two gates simultaneously:
 *   - `story.status = 'published'` (parent has explicitly published it)
 *   - `childProfile.allow_publish = true` (parent has consented to community)
 *
 * Page-level moderation is enforced at *publish time* (see
 * `/api/story/:id/publish`) — a story cannot enter "published" status with
 * any non-safe page. So this query does not need to re-scan pages.
 *
 * Auth: required. Even though the content is community-shared, COPPA
 * dictates a logged-in parent context for any kid-authored content view.
 */

import Link from "next/link";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { childProfile, story, storyPage } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { getWorld } from "@/lib/worlds";

const PAGE_SIZE = 20;

type FeedRow = {
  id: string;
  title: string;
  worldKey: string;
  heroName: string;
  problemText: string;
  createdAt: Date;
  authorName: string;
  pageCount: number;
};

async function loadFeed(
  page: number,
): Promise<{ rows: FeedRow[]; totalCount: number }> {
  const offset = (page - 1) * PAGE_SIZE;

  // Single round-trip for the visible page of stories.
  const rows = await db
    .select({
      id: story.id,
      title: story.title,
      worldKey: story.worldKey,
      heroName: story.heroName,
      problemText: story.problemText,
      createdAt: story.createdAt,
      authorName: childProfile.displayName,
    })
    .from(story)
    .innerJoin(childProfile, eq(childProfile.id, story.childProfileId))
    .where(
      and(eq(story.status, "published"), eq(childProfile.allowPublish, true)),
    )
    .orderBy(desc(story.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  // Total count for pagination — same gate.
  const [totalRow] = await db
    .select({ value: count() })
    .from(story)
    .innerJoin(childProfile, eq(childProfile.id, story.childProfileId))
    .where(
      and(eq(story.status, "published"), eq(childProfile.allowPublish, true)),
    );
  const totalCount = totalRow?.value ?? 0;

  if (rows.length === 0) {
    return { rows: [], totalCount };
  }

  // Page count per story — single grouped query.
  const storyIds = rows.map((r) => r.id);
  const pageCountRows = await db
    .select({ storyId: storyPage.storyId, c: count() })
    .from(storyPage)
    .where(inArray(storyPage.storyId, storyIds))
    .groupBy(storyPage.storyId);

  const pageCountMap = new Map<string, number>();
  for (const r of pageCountRows) pageCountMap.set(r.storyId, r.c);

  return {
    rows: rows.map((r) => ({ ...r, pageCount: pageCountMap.get(r.id) ?? 0 })),
    totalCount,
  };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function CommunityFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;

  // Coerce ?page= to a positive integer (defaults to 1; never trusts arbitrary input).
  const rawPage = Number.parseInt(sp.page ?? "1", 10);
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const { rows, totalCount } = await loadFeed(currentPage);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <header className="mb-14 max-w-2xl">
          <p className="eyebrow">&sect; The community ledger &middot; Tales aloft</p>
          <h1 className="display-lg mt-4 text-4xl md:text-5xl">
            Tales worth{" "}
            <span className="italic-wonk text-[color:var(--ember)]">
              passing on.
            </span>
          </h1>
          <p className="mt-5 font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
            Every tale here has been published by its young author and cleared
            by the moderation crew. Spin off your own remix from any of them
            &mdash; the first four pages come along, the rest is yours to
            forge.
          </p>
        </header>

        {totalCount === 0 ? (
          <article className="card-stamp p-10 text-center">
            <p className="eyebrow text-foreground/55">An empty horizon.</p>
            <p className="mt-4 font-[var(--font-newsreader)] text-[15.5px] italic leading-relaxed text-foreground/70">
              No tales have set sail yet. Be the first &mdash; finish a story,
              enable publishing on your child&rsquo;s profile, and hoist it
              into the wind.
            </p>
          </article>
        ) : (
          <>
            <p className="eyebrow mb-6 text-foreground/55">
              {totalCount} {totalCount === 1 ? "tale" : "tales"} aloft &middot;
              page {safePage} of {totalPages}
            </p>

            <div className="flex flex-col gap-6">
              {rows.map((row) => {
                const world = getWorld(row.worldKey);
                return (
                  <Link
                    key={row.id}
                    href={`/community/${row.id}`}
                    className="card-stamp group block overflow-hidden transition-all hover:-translate-y-[1px] hover:border-[color:var(--ember)]/60"
                  >
                    <div className="px-6 py-5 md:px-8 md:py-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl leading-tight md:text-2xl group-hover:text-[color:var(--ember)] transition-colors">
                            {row.title}
                          </h2>
                          <dl className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-2 font-[var(--font-newsreader)] text-[14px] text-foreground/70">
                            <div className="flex items-baseline gap-1.5">
                              <dt className="eyebrow">By</dt>
                              <dd className="italic">{row.authorName}</dd>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <dt className="eyebrow">World</dt>
                              <dd>{world?.name.en ?? row.worldKey}</dd>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <dt className="eyebrow">Hero</dt>
                              <dd className="italic">{row.heroName}</dd>
                            </div>
                          </dl>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                          <span className="eyebrow text-[color:var(--forest)]">
                            {row.pageCount}{" "}
                            {row.pageCount === 1 ? "page" : "pages"}
                          </span>
                          <span className="eyebrow text-foreground/40">
                            {formatDate(row.createdAt)}
                          </span>
                        </div>
                      </div>
                      {row.problemText && (
                        <p className="mt-4 font-[var(--font-newsreader)] text-[14.5px] italic text-foreground/65 line-clamp-2">
                          &ldquo;{row.problemText}&rdquo;
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Pagination"
                className="mt-12 flex items-center justify-between gap-4"
              >
                <PaginationLink
                  href={
                    safePage > 1 ? `/community?page=${safePage - 1}` : undefined
                  }
                  label="← Newer"
                />
                <span className="eyebrow text-foreground/55">
                  {safePage} / {totalPages}
                </span>
                <PaginationLink
                  href={
                    safePage < totalPages
                      ? `/community?page=${safePage + 1}`
                      : undefined
                  }
                  label="Older →"
                />
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function PaginationLink({
  href,
  label,
}: {
  href: string | undefined;
  label: string;
}) {
  if (!href) {
    return (
      <span className="eyebrow text-foreground/30 cursor-not-allowed">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="eyebrow text-foreground/70 transition-colors hover:text-[color:var(--ember)]"
    >
      {label}
    </Link>
  );
}
