/**
 * Parent's Library — Full Story Visibility (PRD §10)
 *
 * **Route: `/parent/stories`** — lives under `src/app/(parent)/parent/stories/` so it
 * does not collide with `(app)/stories` (`/stories` = app story list).
 *
 * A parent-only view where the logged-in parent can read every child's
 * story in full (all story_page content, verbatim — not summaries).
 *
 * Server Component — session-gated via `requireAuth()`. No "use client".
 */

import { desc, eq, inArray, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  childProfile,
  story,
  storyPage,
  type ChildProfile,
  type Story,
  type StoryPage,
} from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { getWorld } from "@/lib/worlds";
import { PublishToggle } from "./_publish-toggle";

/* ── Data fetching ─────────────────────────────────────────────────── */

/**
 * Load all child profiles owned by the current parent, newest first.
 */
async function loadChildrenForParent(parentId: string): Promise<ChildProfile[]> {
  return db
    .select()
    .from(childProfile)
    .where(eq(childProfile.parentUserId, parentId))
    .orderBy(desc(childProfile.createdAt));
}

/**
 * Load all stories for a set of child profile IDs, newest first.
 */
async function loadStoriesForChildren(childIds: string[]): Promise<Story[]> {
  if (childIds.length === 0) return [];
  return db
    .select()
    .from(story)
    .where(inArray(story.childProfileId, childIds))
    .orderBy(desc(story.createdAt));
}

/**
 * Load all story pages for a set of story IDs, ordered by page number.
 */
async function loadPagesForStories(storyIds: string[]): Promise<StoryPage[]> {
  if (storyIds.length === 0) return [];
  return db
    .select()
    .from(storyPage)
    .where(inArray(storyPage.storyId, storyIds))
    .orderBy(asc(storyPage.pageNumber));
}

/**
 * Format a date in a human-friendly way.
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Get status display label and color class.
 */
function getStatusDisplay(status: string): { label: string; colorClass: string } {
  switch (status) {
    case "complete":
      return { label: "Complete", colorClass: "text-[color:var(--forest)]" };
    case "published":
      return { label: "Published", colorClass: "text-[color:var(--ember)]" };
    case "archived":
      return { label: "Archived", colorClass: "text-foreground/50" };
    default:
      return { label: "Draft", colorClass: "text-[color:var(--gold)]" };
  }
}

/* ── Page component ────────────────────────────────────────────────── */

export default async function ParentStoriesPage() {
  const session = await requireAuth();
  const parentFirstName = session.user.name?.split(" ")[0] ?? "Captain";

  // Fetch the parent's children
  const children = await loadChildrenForParent(session.user.id);

  // Extract child IDs and fetch their stories
  const childIds = children.map((c) => c.id);
  const stories = await loadStoriesForChildren(childIds);

  // Extract story IDs and fetch all pages
  const storyIds = stories.map((s) => s.id);
  const pages = await loadPagesForStories(storyIds);

  // Build lookup maps for efficient rendering
  const pagesByStoryId = new Map<string, StoryPage[]>();
  for (const page of pages) {
    const existing = pagesByStoryId.get(page.storyId) ?? [];
    existing.push(page);
    pagesByStoryId.set(page.storyId, existing);
  }

  // Group stories by child for display
  const storiesByChildId = new Map<string, Story[]>();
  for (const s of stories) {
    const existing = storiesByChildId.get(s.childProfileId) ?? [];
    existing.push(s);
    storiesByChildId.set(s.childProfileId, existing);
  }

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        {/* Page header */}
        <header className="mb-16 max-w-2xl">
          <p className="eyebrow">&sect; The parent&rsquo;s library &middot; All tales</p>
          <h1 className="display-lg mt-4 text-4xl md:text-5xl">
            Every tale,{" "}
            <span className="italic-wonk text-[color:var(--ember)]">verbatim,</span>
            <br />
            {parentFirstName}.
          </h1>
          <p className="mt-5 font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
            Ahoy! Here lies the complete chronicle of your young scribes&rsquo; adventures &mdash;
            every page, every word, just as the storyteller wove them.
          </p>
        </header>

        {/* Empty state when no children exist */}
        {children.length === 0 ? (
          <article className="card-stamp p-10 text-center">
            <p className="eyebrow text-foreground/55">No scribes aboard yet.</p>
            <p className="mt-4 font-[var(--font-newsreader)] text-[15.5px] italic leading-relaxed text-foreground/70">
              Add your first young scribe in the{" "}
              <a href="/children" className="border-b border-[color:var(--ember)]/60 pb-0.5 text-[color:var(--ember)] transition-colors hover:border-[color:var(--ember)]">
                parent&rsquo;s room
              </a>{" "}
              to begin collecting their tales.
            </p>
          </article>
        ) : (
          /* Stories grouped by child */
          <div className="flex flex-col gap-12">
            {children.map((child) => {
              const childStories = storiesByChildId.get(child.id) ?? [];

              return (
                <div key={child.id}>
                  {/* Child header */}
                  <div className="mb-6 flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[color:var(--ember)] font-[var(--font-fraunces)] text-xl italic text-[color:var(--primary-foreground)]">
                      {child.displayName.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <h2 className="text-2xl leading-tight">
                        {child.displayName}&rsquo;s{" "}
                        <span className="italic-wonk text-foreground/70">Tales</span>
                      </h2>
                      <p className="eyebrow mt-1">
                        {childStories.length}{" "}
                        {childStories.length === 1 ? "story" : "stories"} &middot;{" "}
                        {child.age} years
                      </p>
                    </div>
                  </div>

                  {/* Empty state for child with no stories */}
                  {childStories.length === 0 ? (
                    <article className="card-stamp p-8">
                      <p className="font-[var(--font-newsreader)] text-[15.5px] italic text-foreground/60">
                        No tales have been spun for {child.displayName} yet. The storyteller awaits their first adventure!
                      </p>
                    </article>
                  ) : (
                    /* Stories list */
                    <div className="flex flex-col gap-6">
                      {childStories.map((s) => {
                        const storyPages = pagesByStoryId.get(s.id) ?? [];
                        const world = getWorld(s.worldKey);
                        const statusDisplay = getStatusDisplay(s.status);

                        return (
                          <article key={s.id} className="card-stamp overflow-hidden">
                            {/* Story header */}
                            <div className="border-b border-border/60 px-6 py-5 md:px-8">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="text-xl leading-tight md:text-2xl">
                                    {s.title}
                                  </h3>
                                  <dl className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-2 font-[var(--font-newsreader)] text-[14px] text-foreground/70">
                                    <div className="flex items-baseline gap-1.5">
                                      <dt className="eyebrow">World</dt>
                                      <dd>{world?.name.en ?? s.worldKey}</dd>
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                      <dt className="eyebrow">Hero</dt>
                                      <dd className="italic">{s.heroName}</dd>
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                      <dt className="eyebrow">Created</dt>
                                      <dd>{formatDate(s.createdAt)}</dd>
                                    </div>
                                  </dl>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-3">
                                    <span className={`eyebrow ${statusDisplay.colorClass}`}>
                                      {statusDisplay.label}
                                    </span>
                                    <span className="eyebrow text-foreground/40">
                                      {storyPages.length}{" "}
                                      {storyPages.length === 1 ? "page" : "pages"}
                                    </span>
                                  </div>
                                  <PublishToggle
                                    storyId={s.id}
                                    currentStatus={s.status}
                                  />
                                </div>
                              </div>

                              {/* Problem text (story premise) */}
                              {s.problemText && (
                                <p className="mt-4 font-[var(--font-newsreader)] text-[14px] italic text-foreground/60">
                                  &ldquo;{s.problemText}&rdquo;
                                </p>
                              )}
                            </div>

                            {/* Story pages — full verbatim content */}
                            {storyPages.length === 0 ? (
                              <div className="px-6 py-8 md:px-8">
                                <p className="font-[var(--font-newsreader)] text-[15.5px] italic text-foreground/50">
                                  This tale has not yet begun &mdash; no pages have been written.
                                </p>
                              </div>
                            ) : (
                              <div className="divide-y divide-border/40">
                                {storyPages.map((page, idx) => (
                                  <div key={page.id} className="px-6 py-6 md:px-8">
                                    {/* Page header */}
                                    <div className="mb-4 flex items-baseline justify-between">
                                      <p className="eyebrow">
                                        Page {page.pageNumber}
                                      </p>
                                      {page.chosenActionKey && (
                                        <p className="eyebrow text-[color:var(--forest)]">
                                          &check; {page.chosenActionKey}
                                        </p>
                                      )}
                                    </div>

                                    {/* AI-generated content (the verbatim tale) */}
                                    <div className="font-[var(--font-newsreader)] text-[17px] leading-[1.85] text-foreground/90">
                                      {page.aiContent.split("\n\n").map((para, i) => (
                                        <p key={i} className={i > 0 ? "mt-4" : ""}>
                                          {para}
                                        </p>
                                      ))}
                                    </div>

                                    {/* Child's custom input, if any */}
                                    {page.childContent && (
                                      <div className="mt-6 rounded-md border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 p-4">
                                        <p className="eyebrow mb-2 text-[color:var(--gold)]">
                                          {child.displayName}&rsquo;s own words
                                        </p>
                                        <p className="font-[var(--font-newsreader)] text-[15.5px] italic text-foreground/80">
                                          &ldquo;{page.childContent}&rdquo;
                                        </p>
                                      </div>
                                    )}

                                    {/* Divider between pages (except last) */}
                                    {idx < storyPages.length - 1 && (
                                      <div className="rule-ornament mt-6">
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                        >
                                          <path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Story footer with stats */}
                            <div className="border-t border-border/60 bg-[color:var(--card)]/50 px-6 py-4 md:px-8">
                              <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-2 font-[var(--font-newsreader)] text-[13px] text-foreground/55">
                                <div className="flex items-baseline gap-1.5">
                                  <dt className="eyebrow">Words</dt>
                                  <dd>{s.wordCount.toLocaleString()}</dd>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <dt className="eyebrow">Chapters</dt>
                                  <dd>{s.chapterCount}</dd>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <dt className="eyebrow">Last updated</dt>
                                  <dd>{formatDate(s.updatedAt)}</dd>
                                </div>
                              </dl>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
