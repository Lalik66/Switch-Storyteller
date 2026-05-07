"use client";

/**
 * <StoryReader> — interactive child of the story/[id] server page.
 *
 * Responsibilities:
 *   - Render each page's `ai_content` in a `card-stamp` surface.
 *   - Surface page counter, word count, and chapter count metadata.
 *   - Present 3 action buttons + a custom-action textarea below the
 *     latest page.
 *   - POST to `/api/story/page` and stream the next page in. Mirrors
 *     the streaming pattern used by `src/app/chat/page.tsx`.
 */

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage, type AppLang } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// NOTE: `@/lib/schema` is owned by the schema-agent.
import { story, storyPage } from "@/lib/schema";
import type { InferSelectModel } from "drizzle-orm";

type Story = InferSelectModel<typeof story>;
type StoryPage = InferSelectModel<typeof storyPage>;

/* ── Localization ───────────────────────────────────────────────────── */

const COPY: Record<
  AppLang,
  {
    eyebrow: string;
    pageOf: (n: number, total: number) => string;
    wordsLabel: string;
    chaptersLabel: string;
    pagesLabel: string;
    whatNext: string;
    orWriteYourOwn: string;
    customPlaceholder: string;
    send: string;
    sending: string;
    moderated: string;
    streamFailed: string;
    emptyTitle: string;
    emptyBody: string;
    generateImages: string;
    generatingImages: string;
    illustrationsReady: string;
    imageGenFailed: string;
    narrate: string;
    narrating: string;
    audioFailed: string;
    remix: string;
    remixing: string;
    remixFailed: string;
    remixRateLimited: string;
    finish: string;
    finishing: string;
    finished: string;
    finishHint: string;
    completeHint: string;
    publishedHint: string;
    finishFailed: string;
    publish: string;
    publishing: string;
    publishSucceeded: string;
    unpublish: string;
    unpublishing: string;
    unpublishSucceeded: string;
    publishGenericFailed: string;
    publishDisallowedHint: string;
    completeBanner: string;
    publishedBanner: string;
  }
> = {
  en: {
    eyebrow: "\u00a7 The tale \u00b7 In progress",
    pageOf: (n, total) => `page ${n} / ${total}`,
    wordsLabel: "words",
    chaptersLabel: "chapters",
    pagesLabel: "pages",
    whatNext: "What happens next?",
    orWriteYourOwn: "Or \u2014 write your own action",
    customPlaceholder: "Maren steps between the fox and the window\u2026",
    send: "Continue the tale",
    sending: "The quill is moving\u2026",
    moderated: "moderated \u2713",
    streamFailed: "The scribe stumbled. Try again.",
    emptyTitle: "A blank folio.",
    emptyBody:
      "No pages yet. Pick an action below to begin the first page of this tale.",
    generateImages: "Illustrate this tale",
    generatingImages: "Painting the scenes…",
    illustrationsReady: "Illustrated ✓",
    imageGenFailed: "The illustrator stumbled. Try again.",
    narrate: "Narrate this page",
    narrating: "Summoning the storyteller…",
    audioFailed: "The storyteller's voice cracked. Try again.",
    remix: "Remix this tale",
    remixing: "Forging your remix…",
    remixFailed: "The forge ran cold. Try again.",
    remixRateLimited:
      "You've already started a story this week — come back next week for a new adventure.",
    finish: "Finish this tale",
    finishing: "Sealing the last page…",
    finished:
      "Marked complete! You can publish it to the community now.",
    finishHint:
      "Done writing? Mark it complete and then publish to the community.",
    completeHint:
      "This tale is sealed. Hit Publish to send it to the community ledger.",
    publishedHint:
      "This tale is in the community ledger. Other parents can read it.",
    finishFailed: "Couldn't seal the tale. Try again.",
    publish: "Publish to community",
    publishing: "Hoisting the sails…",
    publishSucceeded: "Published! Find it in the community ledger.",
    unpublish: "Unpublish",
    unpublishing: "Lowering the sails…",
    unpublishSucceeded: "Unpublished. Only you can see it now.",
    publishGenericFailed: "Couldn't publish. Try again.",
    publishDisallowedHint:
      "Enable the Publishing pill on this child's profile first.",
    completeBanner: "Complete",
    publishedBanner: "Published",
  },
  az: {
    eyebrow: "\u00a7 Nağıl \u00b7 Davam edir",
    pageOf: (n, total) => `səhifə ${n} / ${total}`,
    wordsLabel: "söz",
    chaptersLabel: "fəsil",
    pagesLabel: "səhifə",
    whatNext: "Sonra nə baş verir?",
    orWriteYourOwn: "Ya da \u2014 öz hərəkətini yaz",
    customPlaceholder: "Maren tülkü ilə pəncərə arasında dayanır\u2026",
    send: "Nağılı davam etdir",
    sending: "Lələk hərəkət edir\u2026",
    moderated: "yoxlanıldı \u2713",
    streamFailed: "Yazıçı büdrədi. Yenə cəhd et.",
    emptyTitle: "Boş folio.",
    emptyBody:
      "Hələ səhifə yoxdur. Bu nağılın ilk səhifəsinə başlamaq üçün aşağıdan bir hərəkət seç.",
    generateImages: "Bu nağılı illüstrasiya et",
    generatingImages: "Səhnələr rənglənir…",
    illustrationsReady: "İllüstrasiya edilib ✓",
    imageGenFailed: "İllüstrator büdrədi. Yenə cəhd et.",
    narrate: "Bu səhifəni səsləndir",
    narrating: "Nağılçı çağırılır…",
    audioFailed: "Nağılçının səsi titrədi. Yenə cəhd et.",
    remix: "Bu nağılı remiks et",
    remixing: "Remiks hazırlanır…",
    remixFailed: "Dəmirçi soyudu. Yenə cəhd et.",
    remixRateLimited:
      "Bu həftə artıq bir nağıl başlatmısan — gələn həftə yeni macəra üçün geri qayıt.",
    finish: "Nağılı bitir",
    finishing: "Son səhifə möhürlənir…",
    finished:
      "Tamamlandı! İndi icmaya nəşr edə bilərsən.",
    finishHint:
      "Yazmağı bitirdin? Tamamla və icmaya nəşr et.",
    completeHint:
      "Bu nağıl möhürlənib. İcma jurnalına göndərmək üçün Nəşr et.",
    publishedHint:
      "Bu nağıl icma jurnalındadır. Digər valideynlər oxuya bilər.",
    finishFailed: "Nağıl möhürlənmədi. Yenə cəhd et.",
    publish: "İcmaya nəşr et",
    publishing: "Yelkən qaldırılır…",
    publishSucceeded: "Nəşr edildi! İcma jurnalında görə bilərsən.",
    unpublish: "Geri çək",
    unpublishing: "Yelkən endirilir…",
    unpublishSucceeded: "Geri çəkildi. İndi yalnız sən görürsən.",
    publishGenericFailed: "Nəşr edilmədi. Yenə cəhd et.",
    publishDisallowedHint:
      "Əvvəlcə uşaq profilində Nəşr açıq pillini aktiv et.",
    completeBanner: "Tamamlandı",
    publishedBanner: "Nəşr edildi",
  },
};

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
}: {
  storyId: string;
  initialStory: Story;
  initialPages: StoryPage[];
  /** Source story meets the Phase 3 remix-eligibility gate. Server-computed. */
  canRemix?: boolean;
}) {
  const { lang } = useLanguage();
  const t = COPY[lang];
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
      const data = (await res.json()) as { status: string };
      setStoryStatus(data.status);
      toast.success(t.finished);
    } catch {
      toast.error(t.finishFailed);
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
          toast.error(t.publishDisallowedHint);
        } else if (body.error === "too_short") {
          toast.error(
            body.message ?? t.publishGenericFailed,
          );
        } else if (body.error === "moderation_pending") {
          toast.error(
            body.message ?? t.publishGenericFailed,
          );
        } else {
          toast.error(body.message ?? t.publishGenericFailed);
        }
        return;
      }
      const data = (await res.json()) as { status: string };
      setStoryStatus(data.status);
      toast.success(
        wantPublish ? t.publishSucceeded : t.unpublishSucceeded,
      );
    } catch {
      toast.error(t.publishGenericFailed);
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
        toast.error(t.remixRateLimited);
        return;
      }
      if (!res.ok) throw new Error(`Remix failed: ${res.status}`);
      const data = (await res.json()) as { storyId: string };
      router.push(`/story/${data.storyId}`);
    } catch {
      toast.error(t.remixFailed);
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
      toast.error(t.audioFailed);
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
      toast.error(t.imageGenFailed);
    } finally {
      setGeneratingImages(false);
    }
  }

  const storyTitle =
    (initialStory as unknown as { title?: string }).title ?? "Untitled tale";

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

  // The three canonical action choices. In Phase 2 these will be
  // supplied per-page by the storyteller response; for Phase 1 we keep
  // a stable trio so the reader is exercisable end-to-end.
  const actionChoices: Array<{ key: string; label: string }> =
    lang === "en"
      ? [
          { key: "a", label: "Step forward bravely" },
          { key: "b", label: "Kneel and whisper" },
          { key: "c", label: "Slip quietly away" },
        ]
      : [
          { key: "a", label: "Cəsarətlə irəli addımla" },
          { key: "b", label: "Diz çök və pıçılda" },
          { key: "c", label: "Səssizcə uzaqlaş" },
        ];

  async function postAndStream(body: {
    storyId: string;
    chosenActionKey?: string;
    customAction?: string;
    lang: AppLang;
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

      if (!res.ok || !res.body) {
        throw new Error(`Story page stream failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // The server sends Vercel AI SDK's UI-message-stream protocol — SSE
      // events of the form `data: <json>\n\n` plus a terminal `data: [DONE]`.
      // Parse them properly: append `text-delta` deltas to display, surface
      // `error` events as a toast, ignore the rest. (Earlier this loop just
      // dumped the raw bytes onto the page, which made errors look like
      // garbage and successful streams look like JSON soup.)
      let sseBuf = "";
      let assembled = "";
      let streamError: string | null = null;
      let redirectMessage: string | null = null;

      const handleEvent = (rawJson: string) => {
        // Sentinel marking end-of-stream.
        if (rawJson === "[DONE]") return;
        let parsed: { type?: string; delta?: string; errorText?: string; redirect?: boolean; message?: string };
        try {
          parsed = JSON.parse(rawJson) as typeof parsed;
        } catch {
          return; // Skip malformed events silently.
        }
        if (parsed.type === "text-delta" && typeof parsed.delta === "string") {
          assembled += parsed.delta;
          setStreamingPage((prev) =>
            prev ? { ...prev, aiContent: assembled } : prev,
          );
        } else if (parsed.type === "error") {
          streamError =
            parsed.errorText ?? "The scribe stumbled.";
        } else if (parsed.redirect && typeof parsed.message === "string") {
          // Layer 1 moderation kid-friendly redirect (200 JSON, not SSE).
          redirectMessage = parsed.message;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuf += decoder.decode(value, { stream: true });
        // Events terminate with a blank line ("\n\n").
        let sep: number;
        while ((sep = sseBuf.indexOf("\n\n")) !== -1) {
          const block = sseBuf.slice(0, sep);
          sseBuf = sseBuf.slice(sep + 2);
          for (const line of block.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            handleEvent(trimmed.slice(5).trim());
          }
        }
      }

      if (streamError) {
        // The server will not have persisted a page on error — drop the
        // streaming placeholder and surface the reason via toast.
        setStreamingPage(null);
        toast.error(streamError);
        return;
      }
      if (redirectMessage) {
        // Moderation soft-block: no page persisted, show the kid-friendly redirect.
        setStreamingPage(null);
        toast(redirectMessage);
        return;
      }
      // On complete: the server has persisted the page. We keep the final
      // streamed text visible without mutating the `pages` array — the
      // next reload (or a follow-up action) will pull the canonical row.
      setCustomAction("");
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        console.error(err);
        toast.error(t.streamFailed);
      }
      setStreamingPage(null);
    } finally {
      setSubmitting(false);
      abortRef.current = null;
    }
  }

  const handleChoice = (key: string) => {
    void postAndStream({ storyId, chosenActionKey: key, lang });
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
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 className="display-lg mt-3 text-4xl md:text-5xl">
              {storyTitle}
            </h1>
            {/* Status banner for non-draft states. */}
            {storyStatus === "complete" && (
              <span className="eyebrow mt-3 inline-block rounded-sm border border-[color:var(--forest)]/40 px-2.5 py-1 text-[color:var(--forest)]">
                ✓ {t.completeBanner}
              </span>
            )}
            {storyStatus === "published" && (
              <span className="eyebrow mt-3 inline-block rounded-sm bg-[color:var(--ember)] px-2.5 py-1 text-[color:var(--primary-foreground)]">
                ✦ {t.publishedBanner}
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
                {finishing ? t.finishing : t.finish}
              </Button>
            )}
            {/* Complete → "Publish to community"; Published → "Unpublish" */}
            {(storyStatus === "complete" || storyStatus === "published") && (
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
                    ? t.unpublishing
                    : t.publishing
                  : storyStatus === "published"
                    ? t.unpublish
                    : t.publish}
              </Button>
            )}
            {canRemix && (
              <Button
                type="button"
                onClick={() => void handleRemix()}
                disabled={remixing}
                className="btn-ember justify-center disabled:opacity-50"
              >
                {remixing ? t.remixing : t.remix}
              </Button>
            )}
          </div>
        </header>
        {/* Status-aware hint line. */}
        {storyStatus === "draft" && pages.length > 0 && (
          <p className="eyebrow mb-6 text-foreground/55">{t.finishHint}</p>
        )}
        {storyStatus === "complete" && (
          <p className="eyebrow mb-6 text-foreground/55">{t.completeHint}</p>
        )}
        {storyStatus === "published" && (
          <p className="eyebrow mb-6 text-foreground/55">{t.publishedHint}</p>
        )}

        <dl className="mb-6 grid grid-cols-3 gap-4">
          <Stat value={stats.pageCount} label={t.pagesLabel} />
          <Stat value={stats.chapters} label={t.chaptersLabel} />
          <Stat value={stats.words} label={t.wordsLabel} />
        </dl>

        {pages.length >= 8 && (
          <div className="mb-8 flex items-center gap-4">
            {images.size > 0 ? (
              <span className="eyebrow flex items-center gap-2 text-[color:var(--forest)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--forest)]" />
                {t.illustrationsReady}
              </span>
            ) : (
              <Button
                type="button"
                onClick={() => void handleGenerateImages()}
                disabled={generatingImages}
                className="btn-ember justify-center disabled:opacity-50"
              >
                {generatingImages ? t.generatingImages : t.generateImages}
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {pages.length === 0 && !streamingPage && (
            <article className="card-stamp p-8 text-center">
              <p className="eyebrow text-foreground/55">{t.emptyTitle}</p>
              <p className="mt-4 font-[var(--font-newsreader)] text-[15.5px] italic leading-relaxed text-foreground/70">
                {t.emptyBody}
              </p>
            </article>
          )}

          {pages.map((page, idx) => {
            const pNum = readPageNumber(page, idx + 1);
            return (
              <PageCard
                key={(page as unknown as { id?: string }).id ?? idx}
                pageNumber={pNum}
                chapterNumber={readChapterNumber(page)}
                total={totalForCounter}
                content={readAiContent(page)}
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
              content={streamingPage.aiContent}
              imageUrl={undefined}
              audioUrl={undefined}
              isLoadingAudio={false}
              onNarrate={undefined}
              t={t}
              isLive
            />
          )}
        </div>

        {storyStatus === "draft" && (
        <article className="card-stamp mt-10 p-6 md:p-8">
          <p className="eyebrow text-foreground/55">{t.whatNext}</p>

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
                onClick={() => handleChoice(choice.key)}
                disabled={submitting}
                className="group flex w-full items-center justify-between rounded-sm border border-border/80 bg-background/60 px-3 py-2.5 text-left text-[14px] text-foreground/85 transition-all hover:-translate-y-[1px] hover:border-[color:var(--ember)] hover:bg-[color:var(--gold)]/20 disabled:opacity-50"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-border text-[10px] font-medium text-foreground/60 group-hover:border-[color:var(--ember)] group-hover:text-[color:var(--ember)]">
                    {choice.key}
                  </span>
                  {choice.label}
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
              {t.orWriteYourOwn}
            </label>
            <Textarea
              id="custom-action"
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              placeholder={t.customPlaceholder}
              rows={3}
              maxLength={400}
              disabled={submitting}
              className="font-[var(--font-newsreader)] text-[15px] leading-relaxed"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow text-foreground/55 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--forest)]" />
                {t.moderated}
              </span>
              <Button
                type="submit"
                disabled={!customAction.trim() || submitting}
                className="btn-ember justify-center disabled:opacity-50"
              >
                {submitting ? t.sending : t.send}
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
  t: (typeof COPY)[AppLang];
  isLive: boolean;
}) {
  return (
    <article className="card-stamp overflow-hidden p-0">
      {imageUrl && (
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`Illustration for page ${pageNumber}`}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="p-6 md:p-8">
        <div className="flex items-baseline justify-between border-b border-border/60 pb-4">
          <div className="flex items-baseline gap-3">
            <span className="eyebrow">
              Ch. {String(chapterNumber).padStart(2, "0")}
            </span>
            {isLive && (
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-[color:var(--ember)]">
                &times; live
              </span>
            )}
          </div>
          <span className="eyebrow">{t.pageOf(pageNumber, total)}</span>
        </div>

        <div className="mt-5 whitespace-pre-wrap font-[var(--font-newsreader)] text-[17px] leading-[1.85] text-foreground/90">
          {content || (
            <span className="italic text-foreground/40">&hellip;</span>
          )}
        </div>

        {!isLive && (audioUrl || onNarrate) && (
          <div className="mt-6 border-t border-border/60 pt-4">
            {audioUrl ? (
              <audio
                controls
                preload="none"
                src={audioUrl}
                className="w-full"
                aria-label={`Narration for page ${pageNumber}`}
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
                {isLoadingAudio ? t.narrating : t.narrate}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
