"use client";

/**
 * <StoryReader> — interactive child of the story/[id] server page.
 *
 * Responsibilities:
 *   - Render each page's `ai_content` in a `card-stamp` surface.
 *   - Surface page counter, word count, and chapter count metadata.
 *   - Present 3 action buttons + a custom-action textarea below the
 *     latest page.
 *   - POST to `/api/story/page` and stream the next page in.
 */

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { StoryPageProse } from "@/components/story/story-page-prose";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppLocale } from "@/i18n/use-app-locale";
import { BADGES_BY_KEY, isKnownBadgeKey } from "@/lib/badges";
import { parseStoryChoices } from "@/lib/parse-story-choices";
// NOTE: `@/lib/schema` is owned by the schema-agent.
import { story, storyPage } from "@/lib/schema";
import type { InferSelectModel } from "drizzle-orm";

/** Translator function for a fixed messages namespace — typed against next-intl's `useTranslations` return. */
type Translator = ReturnType<typeof useTranslations>;

/**
 * Surface a celebratory toast for each newly-earned badge in the API
 * response. Unknown keys (e.g. legacy rows after a catalog removal) are
 * silently skipped so they never break the award path.
 */
function toastNewBadges(newBadges: unknown, tBadges: Translator) {
  if (!Array.isArray(newBadges) || newBadges.length === 0) return;
  for (const key of newBadges) {
    if (typeof key !== "string" || !isKnownBadgeKey(key)) continue;
    const badge = BADGES_BY_KEY[key];
    toast.success(`${badge.icon}  ${tBadges(`${key}.name`)}`, {
      description: tBadges(`${key}.description`),
    });
  }
}

type Story = InferSelectModel<typeof story>;
type StoryPage = InferSelectModel<typeof storyPage>;


/* ── Utilities ──────────────────────────────────────────────────────── */

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Reads any `aiContent` / `ai_content` field defensively — the sibling
 * schema-agent may land on either casing. Returns plain text.
 */
function readAiContent(page: StoryPage): string {
  const record = page as unknown as Record<string, unknown>;
  const value = record.aiContent ?? record.ai_content ?? "";
  return typeof value === "string" ? value : "";
}

function readChapterNumber(page: StoryPage): number {
  const record = page as unknown as Record<string, unknown>;
  const v = record.chapterNumber ?? record.chapter_number ?? 1;
  return typeof v === "number" ? v : 1;
}

function readPageNumber(page: StoryPage, fallback: number): number {
  const record = page as unknown as Record<string, unknown>;
  const v = record.pageNumber ?? record.page_number ?? fallback;
  return typeof v === "number" ? v : fallback;
}

/* ── Component ──────────────────────────────────────────────────────── */

type StreamingPage = {
  id: string;
  pageNumber: number;
  aiContent: string;
  isStreaming: boolean;
};

export function StoryReader({
  storyId,
  initialStory,
  initialPages,
  canRemix = false,
  communityEnabled = false,
}: {
  storyId: string;
  initialStory: Story;
  initialPages: StoryPage[];
  /** Source story meets the Phase 3 remix-eligibility gate. Server-computed. */
  canRemix?: boolean;
  /** Community surface master flag (safety audit 2026-07-17). Server-computed. */
  communityEnabled?: boolean;
}) {
  const lang = useAppLocale();
  const t = useTranslations("Reader");
  const tBadges = useTranslations("Badges");
  const router = useRouter();

  const [pages] = useState<StoryPage[]>(initialPages);
  const [streamingPage, setStreamingPage] = useState<StreamingPage | null>(
    null
  );
  const [customAction, setCustomAction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [remixing, setRemixing] = useState(false);
  const [storyStatus, setStoryStatus] = useState<string>(
    (initialStory as unknown as { status?: string }).status ?? "draft",
  );
  const [finishing, setFinishing] = useState(false);
  const [publishingState, setPublishingState] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function handleFinish() {
    if (finishing || storyStatus !== "draft") return;
    setFinishing(true);
    try {
      const res = await fetch(`/api/story/${storyId}/complete`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Finish failed: ${res.status}`);
      const data = (await res.json()) as {
        status: string;
        newBadges?: string[];
      };
      setStoryStatus(data.status);
      toast.success(t("finished"));
      toastNewBadges(data.newBadges, tBadges);
    } catch {
      toast.error(t("finishFailed"));
    } finally {
      setFinishing(false);
    }
  }

  async function handlePublishToggle() {
    if (publishingState) return;
    const wantPublish = storyStatus !== "published";
    setPublishingState(true);
    try {
      const res = await fetch(`/api/story/${storyId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: wantPublish }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
          currentPageCount?: number;
          requiredPageCount?: number;
        };
        // Surface the server's specific reason when known.
        if (body.error === "publish_disallowed") {
          toast.error(t("publishDisallowedHint"));
        } else if (body.error === "too_short") {
          toast.error(
            body.message ?? t("publishGenericFailed"),
          );
        } else if (body.error === "moderation_pending") {
          toast.error(
            body.message ?? t("publishGenericFailed"),
          );
        } else {
          toast.error(body.message ?? t("publishGenericFailed"));
        }
        return;
      }
      const data = (await res.json()) as {
        status: string;
        newBadges?: string[];
      };
      setStoryStatus(data.status);
      toast.success(
        wantPublish ? t("publishSucceeded") : t("unpublishSucceeded"),
      );
      toastNewBadges(data.newBadges, tBadges);
    } catch {
      toast.error(t("publishGenericFailed"));
    } finally {
      setPublishingState(false);
    }
  }

  async function handleRemix() {
    if (remixing) return;
    setRemixing(true);
    try {
      const res = await fetch(`/api/story/${storyId}/remix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (res.status === 429) {
        toast.error(t("remixRateLimited"));
        return;
      }
      if (!res.ok) throw new Error(`Remix failed: ${res.status}`);
      const data = (await res.json()) as {
        storyId: string;
        newBadges?: string[];
      };
      toastNewBadges(data.newBadges, tBadges);
      router.push(`/story/${data.storyId}`);
    } catch {
      toast.error(t("remixFailed"));
    } finally {
      setRemixing(false);
    }
  }

  // Phase 2: illustrations — keyed by 1-indexed page number.
  const [images, setImages] = useState<Map<number, string>>(new Map());
  const [generatingImages, setGeneratingImages] = useState(false);

  // Phase 2: narration — keyed by 1-indexed page number.
  const [audio, setAudio] = useState<Map<number, string>>(new Map());
  const [loadingAudio, setLoadingAudio] = useState<Set<number>>(new Set());

  // Fetch already-generated images + audio on mount (non-blocking).
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/story/${storyId}/images`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: { images: Array<{ pageNumber: number; url: string }> } | null) => {
          if (cancelled || !data?.images.length) return;
          setImages(new Map(data.images.map((i) => [i.pageNumber, i.url])));
        },
      )
      .catch(() => {});
    fetch(`/api/story/${storyId}/audio`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: { tracks: Array<{ pageNumber: number; url: string }> } | null) => {
          if (cancelled || !data?.tracks.length) return;
          setAudio(new Map(data.tracks.map((tr) => [tr.pageNumber, tr.url])));
        },
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storyId]);

  async function handleNarrate(pageNumber: number) {
    setLoadingAudio((prev) => new Set(prev).add(pageNumber));
    try {
      const res = await fetch(`/api/story/${storyId}/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageNumber }),
      });
      if (!res.ok) throw new Error(`Audio generation failed: ${res.status}`);
      const data = (await res.json()) as {
        tracks: Array<{ pageNumber: number; url: string }>;
      };
      setAudio((prev) => {
        const next = new Map(prev);
        for (const tr of data.tracks) next.set(tr.pageNumber, tr.url);
        return next;
      });
    } catch {
      toast.error(t("audioFailed"));
    } finally {
      setLoadingAudio((prev) => {
        const next = new Set(prev);
        next.delete(pageNumber);
        return next;
      });
    }
  }

  async function handleGenerateImages() {
    setGeneratingImages(true);
    try {
      const res = await fetch(`/api/story/${storyId}/images`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Image generation failed: ${res.status}`);
      const data = (await res.json()) as {
        images: Array<{ pageNumber: number; url: string }>;
      };
      setImages(new Map(data.images.map((i) => [i.pageNumber, i.url])));
    } catch {
      toast.error(t("imageGenFailed"));
    } finally {
      setGeneratingImages(false);
    }
  }

  const storyTitle =
    (initialStory as unknown as { title?: string }).title ?? t("untitled");

  const stats = useMemo(() => {
    const allText = pages
      .map(readAiContent)
      .concat(streamingPage?.aiContent ?? "")
      .join(" ");
    const chapterCount = new Set(pages.map(readChapterNumber)).size || 1;
    return {
      words: countWords(allText),
      chapters: chapterCount,
      pageCount: pages.length + (streamingPage ? 1 : 0),
    };
  }, [pages, streamingPage]);

  const totalForCounter = Math.max(stats.pageCount, 1);

  const fallbackChoiceLabels = t.raw("actionChoices") as string[];
  const fallbackChoices: Array<{ key: string; label: string }> = [
    { key: "a", label: fallbackChoiceLabels[0] ?? "" },
    { key: "b", label: fallbackChoiceLabels[1] ?? "" },
    { key: "c", label: fallbackChoiceLabels[2] ?? "" },
  ];

  const latestPageRawContent = useMemo(() => {
    if (streamingPage) return streamingPage.aiContent;
    if (pages.length === 0) return "";
    return readAiContent(pages[pages.length - 1] as StoryPage);
  }, [pages, streamingPage]);

  const latestPageParsed = useMemo(
    () => parseStoryChoices(latestPageRawContent),
    [latestPageRawContent],
  );

  const choiceKeys = ["a", "b", "c"] as const;
  // The storyteller always ends a page with exactly three choices. Anything
  // short (a truncated generation, an odd page) means the block is incomplete,
  // so fall back to the three generic action choices rather than surfacing a
  // lone stub button.
  const pageChoicesReady =
    !streamingPage?.isStreaming && latestPageParsed.choices.length >= 3;
  const actionChoices: Array<{ key: string; label: string }> = pageChoicesReady
    ? latestPageParsed.choices.map((label, idx) => ({
        key: choiceKeys[idx] ?? String(idx + 1),
        label,
      }))
    : fallbackChoices;

  const choicesDisabled =
    submitting || Boolean(streamingPage?.isStreaming);

  async function postAndStream(body: {
    storyId: string;
    chosenActionKey?: string;
    customAction?: string;
    lang: "en" | "az";
  }) {
    if (submitting) return;
    setSubmitting(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const nextNumber = totalForCounter + 1;
    const placeholder: StreamingPage = {
      id: `streaming-${Date.now()}`,
      pageNumber: nextNumber,
      aiContent: "",
      isStreaming: true,
    };
    setStreamingPage(placeholder);

    try {
      const res = await fetch("/api/story/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Story page request failed: ${res.status}`);
      }

      // The route now returns the FINISHED, already-moderated page as JSON —
      // it no longer streams raw model output. So the child only ever sees
      // text that has cleared Layer 3; we type it out below for a live feel.
      const data = (await res.json()) as {
        page?: { pageNumber: number; aiContent: string; moderationStatus: string };
        redirect?: boolean;
        message?: string;
        error?: string;
      };

      if (data.error) {
        // NEVER render a server-supplied string. The route only ever sends a
        // classified code ("transient" | "hard_config"); both map to one gentle
        // translated line today. Defence-in-depth: even a leaked raw provider
        // message could never reach the child here.
        setStreamingPage(null);
        toast.error(t("scribeStumbled"));
        return;
      }

      if (data.redirect && typeof data.message === "string") {
        // Layer 1 moderation kid-friendly redirect — no page persisted.
        setStreamingPage(null);
        toast(data.message);
        return;
      }

      if (!data.page) {
        setStreamingPage(null);
        toast.error(t("streamFailed"));
        return;
      }

      // Buffered reveal: the full safe text is in hand. Type it out (~12ms per
      // step, capped so long pages don't crawl) and bail early if aborted.
      const fullText = data.page.aiContent;
      await new Promise<void>((resolve) => {
        const step = Math.max(1, Math.ceil(fullText.length / 240));
        let i = 0;
        const tick = () => {
          if (controller.signal.aborted) {
            resolve();
            return;
          }
          i = Math.min(fullText.length, i + step);
          const slice = fullText.slice(0, i);
          setStreamingPage((prev) =>
            prev ? { ...prev, aiContent: slice } : prev,
          );
          if (i >= fullText.length) {
            resolve();
            return;
          }
          window.setTimeout(tick, 12);
        };
        tick();
      });

      // Finalize: show the full text and flip off the live flag so the reader
      // parses out the action choices.
      setStreamingPage((prev) =>
        prev ? { ...prev, aiContent: fullText, isStreaming: false } : prev,
      );
      setCustomAction("");
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        console.error(err);
        toast.error(t("streamFailed"));
      }
      setStreamingPage(null);
    } finally {
      setSubmitting(false);
      abortRef.current = null;
    }
  }

  const handleChoice = (label: string) => {
    void postAndStream({ storyId, chosenActionKey: label, lang });
  };

  const handleCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = customAction.trim();
    if (!text) return;
    void postAndStream({ storyId, customAction: text, lang });
  };

  return (
    <section className="container mx-auto px-6 py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="display-lg mt-3 text-4xl md:text-5xl">
              {storyTitle}
            </h1>
            {/* Status banner for non-draft states. */}
            {storyStatus === "complete" && (
              <span className="eyebrow mt-3 inline-block rounded-sm border border-[color:var(--forest)]/40 px-2.5 py-1 text-[color:var(--forest)]">
                ✓ {t("completeBanner")}
              </span>
            )}
            {storyStatus === "published" && (
              <span className="eyebrow mt-3 inline-block rounded-sm bg-[color:var(--ember)] px-2.5 py-1 text-[color:var(--primary-foreground)]">
                ✦ {t("publishedBanner")}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {/* Draft → "Finish this tale" */}
            {storyStatus === "draft" && pages.length > 0 && (
              <Button
                type="button"
                onClick={() => void handleFinish()}
                disabled={finishing || submitting}
                className="btn-ember justify-center disabled:opacity-50"
              >
                {finishing ? t("finishing") : t("finish")}
              </Button>
            )}
            {/* Complete → "Publish to community"; Published → "Unpublish".
                Gated on the community flag (safety audit 2026-07-17): with the
                surface dark, publishing is hidden here and 404s at the API. */}
            {communityEnabled &&
              (storyStatus === "complete" || storyStatus === "published") && (
              <Button
                type="button"
                onClick={() => void handlePublishToggle()}
                disabled={publishingState}
                className={
                  storyStatus === "published"
                    ? "eyebrow rounded-md border border-border/70 bg-transparent px-4 py-2 text-foreground/70 hover:border-[color:var(--ember)] hover:text-[color:var(--ember)] disabled:opacity-50"
                    : "btn-ember justify-center disabled:opacity-50"
                }
              >
                {publishingState
                  ? storyStatus === "published"
                    ? t("unpublishing")
                    : t("publishing")
                  : storyStatus === "published"
                    ? t("unpublish")
                    : t("publish")}
              </Button>
            )}
            {communityEnabled && canRemix && (
              <Button
                type="button"
                onClick={() => void handleRemix()}
                disabled={remixing}
                className="btn-ember justify-center disabled:opacity-50"
              >
                {remixing ? t("remixing") : t("remix")}
              </Button>
            )}
            {(storyStatus === "complete" || storyStatus === "published") &&
              pages.length > 0 && (
              <Button asChild className="btn-ember justify-center">
                <a
                  href={`/api/story/${storyId}/pdf`}
                  className="text-[color:var(--primary-foreground)]"
                >
                  {t("downloadPdf")}
                </a>
              </Button>
            )}
          </div>
        </header>
        {/* Status-aware hint line. */}
        {storyStatus === "draft" && pages.length > 0 && (
          <p className="eyebrow mb-6 text-foreground/55">{t("finishHint")}</p>
        )}
        {storyStatus === "complete" && (
          <p className="eyebrow mb-6 text-foreground/55">{t("completeHint")}</p>
        )}
        {storyStatus === "published" && (
          <p className="eyebrow mb-6 text-foreground/55">{t("publishedHint")}</p>
        )}

        <dl className="mb-6 grid grid-cols-3 gap-4">
          <Stat value={stats.pageCount} label={t("pagesLabel")} />
          <Stat value={stats.chapters} label={t("chaptersLabel")} />
          <Stat value={stats.words} label={t("wordsLabel")} />
        </dl>

        {pages.length >= 8 && (
          <div className="mb-8 flex items-center gap-4">
            {images.size > 0 ? (
              <span className="eyebrow flex items-center gap-2 text-[color:var(--forest)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--forest)]" />
                {t("illustrationsReady")}
              </span>
            ) : (
              <Button
                type="button"
                onClick={() => void handleGenerateImages()}
                disabled={generatingImages}
                className="btn-ember justify-center disabled:opacity-50"
              >
                {generatingImages ? t("generatingImages") : t("generateImages")}
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {pages.length === 0 && !streamingPage && (
            <article className="card-stamp p-8 text-center">
              <p className="eyebrow text-foreground/55">{t("emptyTitle")}</p>
              <p className="mt-4 font-[var(--font-newsreader)] text-[15.5px] italic leading-relaxed text-foreground/70">
                {t("emptyBody")}
              </p>
            </article>
          )}

          {pages.map((page, idx) => {
            const pNum = readPageNumber(page, idx + 1);
            const rawContent = readAiContent(page);
            const displayContent = parseStoryChoices(rawContent).prose;
            return (
              <PageCard
                key={(page as unknown as { id?: string }).id ?? idx}
                pageNumber={pNum}
                chapterNumber={readChapterNumber(page)}
                total={totalForCounter}
                content={displayContent}
                imageUrl={images.get(pNum)}
                audioUrl={audio.get(pNum)}
                isLoadingAudio={loadingAudio.has(pNum)}
                onNarrate={() => void handleNarrate(pNum)}
                t={t}
                isLive={false}
              />
            );
          })}

          {streamingPage && (
            <PageCard
              key={streamingPage.id}
              pageNumber={streamingPage.pageNumber}
              chapterNumber={
                pages.length > 0
                  ? readChapterNumber(pages[pages.length - 1] as StoryPage)
                  : 1
              }
              total={totalForCounter}
              content={
                streamingPage.isStreaming
                  ? streamingPage.aiContent
                  : parseStoryChoices(streamingPage.aiContent).prose
              }
              imageUrl={undefined}
              audioUrl={undefined}
              isLoadingAudio={false}
              onNarrate={undefined}
              t={t}
              isLive={streamingPage.isStreaming}
            />
          )}
        </div>

        {storyStatus === "draft" && (
        <article className="card-stamp mt-10 p-6 md:p-8">
          <p className="eyebrow text-foreground/55">{t("whatNext")}</p>

          {streamingPage?.isStreaming && (
            <p className="mt-3 font-[var(--font-newsreader)] text-[15px] italic text-foreground/55">
              {t("waitingForPage")}
            </p>
          )}

          <div className="rule-ornament my-5">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {actionChoices.map((choice) => (
              <button
                key={choice.key}
                type="button"
                onClick={() => handleChoice(choice.label)}
                disabled={choicesDisabled}
                className="group flex w-full items-center justify-between rounded-sm border border-border/80 bg-background/60 px-3 py-2.5 text-left text-[14px] text-foreground/85 transition-all hover:-translate-y-[1px] hover:border-[color:var(--ember)] hover:bg-[color:var(--gold)]/20 disabled:opacity-50"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border text-[10px] font-medium text-foreground/60 group-hover:border-[color:var(--ember)] group-hover:text-[color:var(--ember)]">
                    {choice.key}
                  </span>
                  <span className="font-[var(--font-newsreader)] italic">
                    {choice.label}
                  </span>
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-foreground/30 transition-all group-hover:translate-x-1 group-hover:text-[color:var(--ember)]"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ))}
          </div>

          <form
            onSubmit={handleCustomSubmit}
            className="mt-6 flex flex-col gap-3"
          >
            <label
              htmlFor="custom-action"
              className="eyebrow text-foreground/60"
            >
              {t("orWriteYourOwn")}
            </label>
            <Textarea
              id="custom-action"
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              placeholder={t("customPlaceholder")}
              rows={3}
              maxLength={400}
              disabled={choicesDisabled}
              className="font-[var(--font-newsreader)] text-[15px] leading-relaxed"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow text-foreground/55 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--forest)]" />
                {t("moderated")}
              </span>
              <Button
                type="submit"
                disabled={!customAction.trim() || choicesDisabled}
                className="btn-ember justify-center disabled:opacity-50"
              >
                {submitting ? t("sending") : t("send")}
              </Button>
            </div>
          </form>
        </article>
        )}
      </div>
    </section>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-l border-border/70 pl-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="display-lg mt-1 text-4xl text-[color:var(--ember)]">
        {value}
      </dd>
    </div>
  );
}

function PageCard({
  pageNumber,
  chapterNumber,
  total,
  content,
  imageUrl,
  audioUrl,
  isLoadingAudio,
  onNarrate,
  t,
  isLive,
}: {
  pageNumber: number;
  chapterNumber: number;
  total: number;
  content: string;
  imageUrl: string | undefined;
  audioUrl: string | undefined;
  isLoadingAudio: boolean;
  onNarrate: (() => void) | undefined;
  t: Translator;
  isLive: boolean;
}) {
  return (
    <article className="card-stamp overflow-hidden p-0">
      {imageUrl && (
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={t("illustrationAlt", { n: pageNumber })}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="p-6 md:p-8">
        <div className="flex items-baseline justify-between border-b border-border/60 pb-4">
          <div className="flex items-baseline gap-3">
            <span className="eyebrow">
              {t("chapterPrefix")} {String(chapterNumber).padStart(2, "0")}
            </span>
            {isLive && (
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-[color:var(--ember)]">
                &times; {t("liveLabel")}
              </span>
            )}
          </div>
          <span className="eyebrow">{t("pageOf", { n: pageNumber, total })}</span>
        </div>

        <div className="mt-5">
          <StoryPageProse content={content} />
        </div>

        {!isLive && (audioUrl || onNarrate) && (
          <div className="mt-6 border-t border-border/60 pt-4">
            {audioUrl ? (
              <audio
                controls
                preload="none"
                src={audioUrl}
                className="w-full"
                aria-label={t("narrationAlt", { n: pageNumber })}
              />
            ) : (
              <button
                type="button"
                onClick={onNarrate}
                disabled={isLoadingAudio}
                className="eyebrow flex items-center gap-2 text-[color:var(--ember)] transition-opacity hover:opacity-70 disabled:opacity-50"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                {isLoadingAudio ? t("narrating") : t("narrate")}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
