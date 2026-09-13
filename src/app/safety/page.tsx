/**
 * Safety commitments — the full-page expansion of the four parent-trust
 * pillars teased in the landing "For the grown-ups" section
 * (`landing-below-fold`). Content is driven entirely by the `Safety`
 * messages namespace, so it renders in whichever locale the visitor has
 * selected (cookie-resolved in `src/i18n/request.ts`).
 *
 * Uses the dark "reading room" band documented in
 * `docs/design-system/patterns.md` for the hero, then the standard
 * parchment canvas for the commitments themselves.
 */

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type Section = {
  number: string;
  title: string;
  lead: string;
  points: string[];
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Safety.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function SafetyPage() {
  const t = await getTranslations("Safety");
  // `raw` returns the structured array verbatim, bypassing ICU formatting.
  const sections = t.raw("sections") as Section[];

  return (
    <>
      {/* Dark reading-room hero band (patterns.md → "Dark reading room section") */}
      <section className="relative border-b border-border/60 bg-[color:var(--ink)] py-24 text-[color:var(--parchment)] md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <p className="eyebrow !text-[color:var(--gold)]">{t("eyebrow")}</p>
            <h1 className="display-lg mt-4 text-5xl text-[color:var(--parchment)] md:text-6xl">
              {t("title1")}{" "}
              <span className="italic-wonk text-[color:var(--gold)]">
                {t("titleAccent")}
              </span>
            </h1>
            <p className="mt-6 max-w-2xl font-[var(--font-newsreader)] text-[16px] leading-relaxed text-[color:var(--parchment)]/75">
              {t("intro")}
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 text-sm text-[color:var(--gold)]/80 transition-colors hover:text-[color:var(--gold)]"
            >
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </section>

      {/* Commitments, expanded */}
      <section className="container mx-auto px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-16">
            {sections.map((s) => (
              <article
                key={s.number}
                className="grid gap-5 md:grid-cols-[auto_1fr] md:gap-10"
              >
                <span className="font-mono text-sm text-[color:var(--ember)]">
                  {s.number}
                </span>
                <div>
                  <h2 className="display-lg text-3xl text-foreground md:text-4xl">
                    {s.title}
                  </h2>
                  <p className="mt-3 font-[var(--font-newsreader)] text-[16px] italic leading-relaxed text-foreground/70">
                    {s.lead}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {s.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-3 text-[15px] leading-relaxed text-foreground/80"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mt-0.5 shrink-0 text-[color:var(--ember)]"
                          aria-hidden="true"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          {/* Closing invitation */}
          <div className="card-stamp mt-20 p-10 text-center md:p-14">
            <h2 className="display-lg text-3xl text-foreground md:text-4xl">
              {t("closingTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
              {t("closingBody")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className="btn-ember">
                {t("ctaPrimary")}
              </Link>
              <Link href="/" className="btn-ghost-ink">
                {t("ctaSecondary")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
