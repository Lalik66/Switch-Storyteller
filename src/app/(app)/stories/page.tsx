/**
 * Stories list — all stories belonging to the authenticated parent's
 * children, grouped by child profile.
 *
 * Server Component: session-gated via `requireAuth()`, queries the DB
 * directly using Drizzle ORM. No API routes involved.
 */

import Link from "next/link";
import { count, desc, eq, inArray } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { childProfile, story, storyPage } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { getWorld } from "@/lib/worlds";
import type { InferSelectModel } from "drizzle-orm";

type ChildProfile = InferSelectModel<typeof childProfile>;
type Story = InferSelectModel<typeof story>;

/** A child profile together with its stories, pre-sorted newest first. */
type ChildWithStories = {
  child: ChildProfile;
  stories: Story[];
};

type StoryStatus = Story["status"];

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

/**
 * Loads every child profile owned by the parent, together with each
 * child's stories ordered by creation date descending.
 *
 * Two queries are cheaper and simpler than a single JOIN that would
 * require post-processing to re-group rows. The child list is always
 * small (single-digit count per parent).
 */
async function loadStoriesGroupedByChild(
  parentId: string,
): Promise<{
  grouped: ChildWithStories[];
  pageCountByStoryId: Map<string, number>;
}> {
  const children = await db
    .select()
    .from(childProfile)
    .where(eq(childProfile.parentUserId, parentId))
    .orderBy(desc(childProfile.createdAt));

  if (children.length === 0) {
    return { grouped: [], pageCountByStoryId: new Map() };
  }

  // Batch-fetch all stories for every child in a single query (avoids N+1).
  const childIds = children.map((c) => c.id);
  const allStories = await db
    .select()
    .from(story)
    .where(inArray(story.childProfileId, childIds))
    .orderBy(desc(story.createdAt));

  const storyIds = allStories.map((s) => s.id);
  const pageCountByStoryId = new Map<string, number>();

  if (storyIds.length > 0) {
    const pageCountRows = await db
      .select({
        storyId: storyPage.storyId,
        pageCount: count(),
      })
      .from(storyPage)
      .where(inArray(storyPage.storyId, storyIds))
      .groupBy(storyPage.storyId);

    for (const row of pageCountRows) {
      pageCountByStoryId.set(row.storyId, Number(row.pageCount));
    }
  }

  // Group stories by child in memory.
  const storyMap = new Map<string, Story[]>();
  for (const s of allStories) {
    const arr = storyMap.get(s.childProfileId) ?? [];
    arr.push(s);
    storyMap.set(s.childProfileId, arr);
  }

  const grouped = children.map((child) => ({
    child,
    stories: storyMap.get(child.id) ?? [],
  }));

  return { grouped, pageCountByStoryId };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Maps a story status to a badge variant for visual distinction. */
function statusVariant(
  status: StoryStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "complete":
    case "published":
      return "default";
    case "draft":
      return "secondary";
    case "archived":
      return "outline";
    default:
      return "secondary";
  }
}

/** Formats a Date using the active UI locale. */
function formatDate(date: Date, locale: string): string {
  const dateLocale = locale === "az" ? "az-AZ" : "en-US";
  return date.toLocaleDateString(dateLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isStoryStatus(value: string): value is StoryStatus {
  return (
    value === "draft" ||
    value === "complete" ||
    value === "published" ||
    value === "archived"
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function StoriesListPage() {
  const session = await requireAuth();
  const t = await getTranslations("StoriesList");
  const locale = await getLocale();
  const { grouped, pageCountByStoryId } = await loadStoriesGroupedByChild(
    session.user.id,
  );

  const hasAnyStories = grouped.some((g) => g.stories.length > 0);

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="display-lg mt-4 text-4xl md:text-5xl">
              {t("titleLead")}{" "}
              <span className="italic-wonk text-[color:var(--ember)]">
                {t("titleAccent")}
              </span>
            </h1>
            <p className="mt-5 font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
              {t("intro")}
            </p>
          </div>
          {grouped.length > 0 && (
            <Link
              href="/story/new"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-[color:var(--ember)] px-5 text-sm font-medium text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 md:self-end"
            >
              {t("startNewTale")}
            </Link>
          )}
        </header>

        {!hasAnyStories ? (
          <EmptyState hasChildren={grouped.length > 0} t={t} />
        ) : (
          <div className="space-y-14">
            {grouped.map(({ child, stories: childStories }) => (
              <ChildStoryGroup
                key={child.id}
                child={child}
                stories={childStories}
                pageCountByStoryId={pageCountByStoryId}
                locale={locale}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (server-only, no "use client")
// ---------------------------------------------------------------------------

type StoriesListTranslator = Awaited<
  ReturnType<typeof getTranslations<"StoriesList">>
>;

/**
 * Empty state shown when no stories exist yet. Differentiates between
 * "no children added" and "children exist but no stories written".
 */
function EmptyState({
  hasChildren,
  t,
}: {
  hasChildren: boolean;
  t: StoriesListTranslator;
}) {
  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="text-xl">{t("emptyTitle")}</CardTitle>
        <CardDescription>
          {hasChildren ? t("emptyBodyNoStories") : t("emptyBodyNoChildren")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href={hasChildren ? "/story/new" : "/children"}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {hasChildren ? t("startNewStory") : t("addChild")}
        </Link>
      </CardContent>
    </Card>
  );
}

/** A section for a single child, listing all their story cards. */
function ChildStoryGroup({
  child,
  stories: childStories,
  pageCountByStoryId,
  locale,
  t,
}: {
  child: ChildProfile;
  stories: Story[];
  pageCountByStoryId: Map<string, number>;
  locale: string;
  t: StoriesListTranslator;
}) {
  if (childStories.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">
        {t("childStoriesHeading", { name: child.displayName })}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {childStories.map((s) => (
          <StoryCard
            key={s.id}
            story={s}
            pageCount={pageCountByStoryId.get(s.id) ?? 0}
            locale={locale}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

/** An individual story card linking to the story reader. */
async function StoryCard({
  story: s,
  pageCount,
  locale,
  t,
}: {
  story: Story;
  pageCount: number;
  locale: string;
  t: StoriesListTranslator;
}) {
  const world = getWorld(s.worldKey);
  const tWorlds = await getTranslations("Worlds");
  const worldName = world ? tWorlds(`${world.key}.name`) : s.worldKey;
  const statusLabel = isStoryStatus(s.status)
    ? t(`status.${s.status}`)
    : s.status;

  return (
    <Link href={`/story/${s.id}`} className="group block">
      <Card className="transition-shadow group-hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{s.title}</CardTitle>
            <Badge variant={statusVariant(s.status)} className="shrink-0">
              {statusLabel}
            </Badge>
          </div>
          <CardDescription>{worldName}</CardDescription>
        </CardHeader>

        <CardContent>
          <dl className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div>
              <dt className="font-medium text-foreground/80">
                {t("heroLabel")}
              </dt>
              <dd className="truncate">{s.heroName}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground/80">
                {t("wordsLabel")}
              </dt>
              <dd>{s.wordCount.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground/80">
                {t("pagesLabel")}
              </dt>
              <dd>{pageCount}</dd>
            </div>
          </dl>

          <p className="mt-3 text-xs text-muted-foreground">
            {t("created", { date: formatDate(s.createdAt, locale) })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
