"use client";

/**
 * <PublicReader> — read-only view of a published community story with a
 * Remix button. No streaming, no action choices, no custom-action input.
 *
 * Cross-account remix flow: the user clicks "Remix this tale" → POST to
 * `/api/story/:id/remix` → on 201 success, route to the new draft.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AppLang } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { BADGES_BY_KEY, isKnownBadgeKey } from "@/lib/badges";
import { story, storyPage } from "@/lib/schema";
import { getWorld } from "@/lib/worlds";
import type { InferSelectModel } from "drizzle-orm";

type Story = InferSelectModel<typeof story>;
type StoryPage = InferSelectModel<typeof storyPage>;

export function PublicReader({
  storyId,
  story: source,
  pages,
  authorName,
  canRemix,
}: {
  storyId: string;
  story: Story;
  pages: StoryPage[];
  authorName: string;
  canRemix: boolean;
}) {
  const t = useTranslations("PublicReader");
  // Worlds + badges still ship their copy as `{ en, az }` records, so we
  // need the raw locale to index them. PR 4 will migrate those too.
  const locale = useLocale() as AppLang;
  const router = useRouter();

  const [remixing, setRemixing] = useState(false);
  const world = getWorld(source.worldKey);
  const worldName = world?.name[locale] ?? source.worldKey;

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
      // Surface a celebratory toast for any newly-earned badges before
      // routing the parent into the new draft.
      if (Array.isArray(data.newBadges)) {
        for (const key of data.newBadges) {
          if (typeof key !== "string" || !isKnownBadgeKey(key)) continue;
          const badge = BADGES_BY_KEY[key];
          const i18n = badge.i18n[locale];
          toast.success(`${badge.icon}  ${i18n.name}`, {
            description: i18n.description,
          });
        }
      }
      router.push(`/story/${data.storyId}`);
    } catch {
      toast.error(t("remixFailed"));
    } finally {
      setRemixing(false);
    }
  }

  return (
    <section className="container mx-auto px-6 py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/community"
          className="eyebrow text-foreground/55 transition-colors hover:text-[color:var(--ember)]"
        >
          {t("backToFeed")}
        </Link>

        <header className="mt-6 mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="display-lg mt-3 text-4xl md:text-5xl">
              {source.title}
            </h1>
            <dl className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2 font-[var(--font-newsreader)] text-[14px] text-foreground/70">
              <div className="flex items-baseline gap-1.5">
                <dt className="eyebrow">{t("by")}</dt>
                <dd className="italic">{authorName}</dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="eyebrow">{t("world")}</dt>
                <dd>{worldName}</dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="eyebrow">{t("hero")}</dt>
                <dd className="italic">{source.heroName}</dd>
              </div>
            </dl>
          </div>
          {canRemix && (
            <Button
              type="button"
              onClick={() => void handleRemix()}
              disabled={remixing}
              className="btn-ember justify-center disabled:opacity-50 md:self-end"
            >
              {remixing ? t("remixing") : t("remix")}
            </Button>
          )}
        </header>

        <div className="flex flex-col gap-6">
          {pages.map((page) => (
            <article
              key={page.id}
              className="card-stamp p-6 md:p-8"
            >
              <p className="eyebrow text-foreground/55">
                {t("pageLabel", { n: page.pageNumber })}
              </p>
              <div className="rule-ornament my-5">
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="font-[var(--font-newsreader)] text-[17px] leading-[1.85] text-foreground/90">
                {page.aiContent.split("\n\n").map((para, i) => (
                  <p key={i} className={i > 0 ? "mt-4" : ""}>
                    {para}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
