/**
 * Stories list — all stories belonging to the authenticated parent's
 * children, grouped by child profile.
 *
 * Server Component: session-gated via `requireAuth()`, queries the DB
 * directly using Drizzle ORM. No API routes involved.
 */

import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { childProfile, story } from "@/lib/schema";
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
  parentId: string
): Promise<ChildWithStories[]> {
  const children = await db
    .select()
    .from(childProfile)
    .where(eq(childProfile.parentUserId, parentId))
    .orderBy(desc(childProfile.createdAt));

  if (children.length === 0) return [];

  // Batch-fetch all stories for every child in a single query (avoids N+1).
  const childIds = children.map((c) => c.id);
  const allStories = await db
    .select()
    .from(story)
    .where(inArray(story.childProfileId, childIds))
    .orderBy(desc(story.createdAt));

  // Group stories by child in memory.
  const storyMap = new Map<string, Story[]>();
  for (const s of allStories) {
    const arr = storyMap.get(s.childProfileId) ?? [];
    arr.push(s);
    storyMap.set(s.childProfileId, arr);
  }

  return children.map((child) => ({
    child,
    stories: storyMap.get(child.id) ?? [],
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Maps a story status to a badge variant for visual distinction. */
function statusVariant(
  status: Story["status"]
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

/** Formats a Date to a short, human-friendly string. */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function StoriesListPage() {
  const session = await requireAuth();
  const grouped = await loadStoriesGroupedByChild(session.user.id);

  const hasAnyStories = grouped.some((g) => g.stories.length > 0);

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 max-w-2xl">
          <p className="eyebrow">&sect; The library &middot; All stories</p>
          <h1 className="display-lg mt-4 text-4xl md:text-5xl">
            Your children&rsquo;s{" "}
            <span className="italic-wonk text-[color:var(--ember)]">
              stories.
            </span>
          </h1>
          <p className="mt-5 font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
            Every tale your little scribes have started or finished, gathered
            in one place. Tap any card to continue reading.
          </p>
        </header>

        {!hasAnyStories ? (
          <EmptyState hasChildren={grouped.length > 0} />
        ) : (
          <div className="space-y-14">
            {grouped.map(({ child, stories }) => (
              <ChildStoryGroup
                key={child.id}
                child={child}
                stories={stories}
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

/**
 * Empty state shown when no stories exist yet. Differentiates between
 * "no children added" and "children exist but no stories written".
 */
function EmptyState({ hasChildren }: { hasChildren: boolean }) {
  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="text-xl">No stories yet</CardTitle>
        <CardDescription>
          {hasChildren
            ? "Your children haven\u2019t started any stories. Time for a new adventure!"
            : "Add a child profile first, then start creating stories together."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href={hasChildren ? "/story/new" : "/children"}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {hasChildren ? "Start a new story" : "Add a child profile"}
        </Link>
      </CardContent>
    </Card>
  );
}

/** A section for a single child, listing all their story cards. */
function ChildStoryGroup({
  child,
  stories,
}: {
  child: ChildProfile;
  stories: Story[];
}) {
  if (stories.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">
        {child.displayName}&rsquo;s stories
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {stories.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
      </div>
    </div>
  );
}

/** An individual story card linking to the story reader. */
function StoryCard({ story: s }: { story: Story }) {
  const world = getWorld(s.worldKey);
  const worldName = world?.name.en ?? s.worldKey;

  return (
    <Link href={`/story/${s.id}`} className="group block">
      <Card className="transition-shadow group-hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">
              {s.title}
            </CardTitle>
            <Badge variant={statusVariant(s.status)} className="shrink-0">
              {s.status}
            </Badge>
          </div>
          <CardDescription>{worldName}</CardDescription>
        </CardHeader>

        <CardContent>
          <dl className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div>
              <dt className="font-medium text-foreground/80">Hero</dt>
              <dd className="truncate">{s.heroName}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground/80">Words</dt>
              <dd>{s.wordCount.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground/80">Pages</dt>
              <dd>{s.chapterCount}</dd>
            </div>
          </dl>

          <p className="mt-3 text-xs text-muted-foreground">
            Created {formatDate(s.createdAt)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
