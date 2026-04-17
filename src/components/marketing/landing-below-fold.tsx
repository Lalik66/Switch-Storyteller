"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import {
  LANDING_COPY,
  WORLD_MARKETING_ORDER,
  type WorldMarketingKey,
} from "@/lib/landing-copy";

function WorldTileArt({ tileKey }: { tileKey: WorldMarketingKey }) {
  switch (tileKey) {
    case "moonlit-forest":
      return (
        <>
          <circle cx="76" cy="28" r="10" fill="var(--gold)" opacity="0.85" />
          <path
            d="M0 80 L20 50 L30 68 L40 40 L52 65 L62 48 L75 70 L90 45 L100 80 Z"
            fill="currentColor"
          />
          <path
            d="M0 80 L100 80 L100 100 L0 100 Z"
            fill="currentColor"
            opacity="0.6"
          />
        </>
      );
    case "clockwork":
      return (
        <>
          <circle
            cx="50"
            cy="50"
            r="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle
            cx="50"
            cy="50"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M50 34 L50 50 L62 55"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
            (a) => (
              <line
                key={a}
                x1="50"
                y1="26"
                x2="50"
                y2="30"
                stroke="currentColor"
                strokeWidth="1"
                transform={`rotate(${a} 50 50)`}
              />
            )
          )}
        </>
      );
    case "sunken":
      return (
        <>
          <path
            d="M0 40 Q 25 30 50 45 T 100 40 L100 100 L0 100 Z"
            fill="currentColor"
            opacity="0.3"
          />
          <path
            d="M0 55 Q 25 45 50 60 T 100 55 L100 100 L0 100 Z"
            fill="currentColor"
            opacity="0.55"
          />
          <circle cx="28" cy="70" r="3" fill="var(--gold)" />
          <circle cx="72" cy="78" r="2" fill="var(--gold)" />
          <path
            d="M50 65 L53 75 L47 75 Z M50 60 L50 70"
            stroke="currentColor"
            fill="none"
          />
        </>
      );
    case "dragons-spine":
      return (
        <>
          <path
            d="M0 80 L18 30 L35 60 L50 20 L65 55 L82 35 L100 80 Z"
            fill="currentColor"
          />
          <path
            d="M0 80 L100 80 L100 100 L0 100 Z"
            fill="currentColor"
            opacity="0.5"
          />
          <circle cx="80" cy="22" r="4" fill="var(--ember)" />
        </>
      );
    case "stardust":
      return (
        <>
          <path d="M20 80 L20 55 L35 45 L50 55 L50 80 Z" fill="currentColor" />
          <path
            d="M55 80 L55 60 L70 50 L85 60 L85 80 Z"
            fill="currentColor"
            opacity="0.7"
          />
          {[15, 35, 62, 78, 45, 90].map((x, i) => (
            <circle
              key={i}
              cx={x}
              cy={15 + (i % 3) * 10}
              r="1.2"
              fill="var(--gold)"
              className="twinkle"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </>
      );
    case "hollow-meadows":
      return (
        <>
          <path
            d="M0 75 Q 30 65 50 72 T 100 70 L100 100 L0 100 Z"
            fill="currentColor"
          />
          <circle cx="30" cy="70" r="3" fill="var(--gold)" />
          <circle cx="60" cy="72" r="2.5" fill="var(--ember)" />
          <circle cx="78" cy="68" r="2" fill="var(--gold)" />
          <path
            d="M25 70 L25 55 M58 72 L58 58 M76 68 L76 55"
            stroke="currentColor"
            strokeWidth="0.8"
          />
        </>
      );
  }
}

const TONES: Record<WorldMarketingKey, string> = {
  "moonlit-forest": "oklch(0.42 0.072 155)",
  clockwork: "oklch(0.55 0.12 70)",
  sunken: "oklch(0.52 0.11 220)",
  "dragons-spine": "oklch(0.5 0.14 40)",
  stardust: "oklch(0.48 0.12 305)",
  "hollow-meadows": "oklch(0.58 0.11 125)",
};

const LOOP_ICONS: [ReactNode, ReactNode, ReactNode] = [
  <path
    key="a"
    d="M12 2l2.2 6.8H22l-6 4.4 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.4h7.8z"
  />,
  <path
    key="b"
    d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 0v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"
  />,
  <path
    key="c"
    d="M4 4h10a4 4 0 014 4v12H8a4 4 0 01-4-4V4zM4 4v12a4 4 0 004 4M14 4v16"
  />,
];

export function LandingBelowFold() {
  const { lang } = useLanguage();
  const c = LANDING_COPY[lang];

  return (
    <>
      <div className="relative overflow-hidden border-y border-border/60 bg-[color:var(--card)]/60 py-5">
        <div className="marquee">
          {[...c.ticker, ...c.ticker].map((f, i) => (
            <span
              key={i}
              className="flex-shrink-0 text-[1.4rem] italic leading-none text-foreground/55 font-[var(--font-newsreader)]"
            >
              {f}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
      </div>

      <section id="loop" className="container mx-auto px-6 py-32">
        <header className="mb-16 max-w-2xl">
          <p className="eyebrow">{c.loop.eyebrow}</p>
          <h2 className="display-lg mt-4 text-5xl md:text-6xl">
            {c.loop.title}{" "}
            <span className="italic-wonk text-foreground/55">
              {c.loop.titleAccent}
            </span>
          </h2>
        </header>

        <div className="grid gap-8 md:grid-cols-3">
          {c.loop.steps.map((s, i) => (
            <article key={s.n} className="relative">
              <div className="flex items-baseline justify-between">
                <span className="display-lg text-[color:var(--ember)] text-[5.5rem] leading-none">
                  {s.n}
                </span>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground/35"
                  aria-hidden="true"
                >
                  {LOOP_ICONS[i]}
                </svg>
              </div>

              <div className="mt-4 h-px w-full bg-gradient-to-r from-[color:var(--ember)]/60 via-border to-transparent" />

              <h3 className="mt-6 text-2xl text-foreground">{s.title}</h3>
              <p className="mt-3 max-w-sm text-[15.5px] leading-relaxed text-foreground/70">
                {s.body}
              </p>

              {i < c.loop.steps.length - 1 && (
                <svg
                  className="absolute -right-6 top-10 hidden text-[color:var(--ember)]/40 md:block"
                  width="40"
                  height="24"
                  viewBox="0 0 40 24"
                  aria-hidden="true"
                >
                  <path
                    d="M2 12 C 10 2, 18 22, 28 12"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    fill="none"
                    strokeDasharray="2 3"
                  />
                  <path
                    d="M28 12 L 24 9 M28 12 L 24 15"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </article>
          ))}
        </div>
      </section>

      <section
        id="worlds"
        className="relative border-y border-border/60 bg-[color:var(--card)]/40 py-32"
      >
        <div className="container mx-auto px-6">
          <header className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow">{c.worlds.eyebrow}</p>
              <h2 className="display-lg mt-4 text-5xl md:text-6xl">
                {c.worlds.title1}
                <br />
                <span className="italic-wonk text-[color:var(--ember)]">
                  {c.worlds.titleAccent}
                </span>{" "}
                {c.worlds.title2}
              </h2>
            </div>
            <p className="max-w-sm text-[15.5px] leading-relaxed text-foreground/70">
              {c.worlds.blurb}
            </p>
          </header>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WORLD_MARKETING_ORDER.map((key, i) => {
              const tone = TONES[key];
              const tile = c.worlds.tiles[key];
              return (
                <article
                  key={key}
                  className="group card-stamp relative overflow-hidden p-0 transition-all duration-500 hover:-translate-y-1"
                >
                  <div
                    className="relative aspect-[4/3] w-full overflow-hidden"
                    style={{
                      color: tone,
                      background: `color-mix(in oklch, ${tone} 14%, var(--card))`,
                    }}
                  >
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="xMidYMid slice"
                      className="absolute inset-0 h-full w-full transition-transform duration-[1.2s] group-hover:scale-[1.06]"
                      aria-hidden="true"
                    >
                      <WorldTileArt tileKey={key} />
                    </svg>
                    <span className="absolute left-4 top-4 rounded-full border border-foreground/15 bg-background/70 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground/70 backdrop-blur">
                      {c.worlds.indexLabel} {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 px-5 py-4">
                    <div>
                      <h3 className="text-xl leading-tight text-foreground">
                        {tile.name}
                      </h3>
                      <p className="eyebrow mt-1 !tracking-[0.18em]">{tile.tag}</p>
                    </div>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="shrink-0 text-foreground/40 transition-all group-hover:translate-x-1 group-hover:text-[color:var(--ember)]"
                    >
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="sample" className="container mx-auto px-6 py-32">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <p className="eyebrow">{c.sample.eyebrow}</p>
            <h2 className="display-lg mt-4 text-5xl md:text-6xl">
              {c.sample.title1}
              <br />
              <span className="italic-wonk">{c.sample.titleAccent}</span>
            </h2>
            <p className="mt-6 max-w-md text-[15.5px] leading-relaxed text-foreground/70">
              {c.sample.body}
            </p>
            <dl className="mt-10 grid max-w-md grid-cols-2 gap-6">
              {c.sample.stats.map(([n, l]) => (
                <div key={l} className="border-l border-border/70 pl-4">
                  <dt
                    className="display-lg text-4xl text-[color:var(--ember)]"
                    dangerouslySetInnerHTML={{ __html: n }}
                  />
                  <dd
                    className="eyebrow mt-1"
                    dangerouslySetInnerHTML={{ __html: l }}
                  />
                </div>
              ))}
            </dl>
          </div>

          <div className="relative lg:col-span-7">
            <div className="card-stamp relative p-8 md:p-10">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--ember)] text-xs font-[var(--font-fraunces)] text-[color:var(--primary-foreground)] italic">
                    M
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm text-foreground">{c.sample.cardTitle}</p>
                    <p className="eyebrow">{c.sample.cardMeta}</p>
                  </div>
                </div>
                <span className="eyebrow">{c.sample.pageCounter}</span>
              </div>

              <p className="mt-6 font-[var(--font-newsreader)] text-[17px] leading-[1.85] text-foreground/90">
                {c.sample.p1}{" "}
                <em className="italic text-[color:var(--ember)]">{c.sample.p1Em}</em>{" "}
                {c.sample.p1b}
              </p>

              <p className="mt-4 font-[var(--font-newsreader)] text-[17px] leading-[1.85] text-foreground/90">
                {c.sample.p2Before}{" "}
                <span className="bg-[color:var(--gold)]/40 px-0.5">
                  {c.sample.p2Highlight}
                </span>{" "}
                {c.sample.p2After}
              </p>

              <div className="rule-ornament my-7">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <p className="eyebrow mb-3">{c.sample.question}</p>
              <div className="grid gap-2 md:grid-cols-3">
                {c.sample.choices.map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    className="group flex items-center gap-3 rounded-sm border border-border/80 bg-background/60 px-3 py-3 text-left text-sm text-foreground/85 transition-all hover:-translate-y-[2px] hover:border-[color:var(--ember)] hover:bg-[color:var(--gold)]/20"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full border border-border text-[11px] text-foreground/60 group-hover:border-[color:var(--ember)] group-hover:text-[color:var(--ember)]">
                      {String.fromCharCode(97 + idx)}
                    </span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-[12px] text-foreground/55">
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 4a6 6 0 00-8 0L5 11v7h7l7-7a6 6 0 000-7z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                  </svg>
                  {c.sample.customHint}
                </span>
                <span className="font-mono">{c.sample.moderated}</span>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-2 top-8 h-24 w-6 bg-[color:var(--ember)] shadow-[0_6px_12px_-6px_rgba(0,0,0,0.4)]">
              <div className="absolute bottom-0 left-0 h-0 w-0 border-b-[12px] border-l-[12px] border-r-[12px] border-b-transparent border-l-[color:var(--ember)] border-r-[color:var(--ember)]" />
            </div>
          </div>
        </div>
      </section>

      <section
        id="parents"
        className="relative border-y border-border/60 bg-[color:var(--ink)] py-32 text-[color:var(--parchment)]"
      >
        <div className="container mx-auto px-6">
          <div className="grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow !text-[color:var(--gold)]">{c.parents.eyebrow}</p>
              <h2 className="display-lg mt-4 text-5xl md:text-6xl text-[color:var(--parchment)]">
                {c.parents.title1}
                <br />
                <span className="italic-wonk text-[color:var(--gold)]">
                  {c.parents.titleAccent}
                </span>
              </h2>
              <p className="mt-6 max-w-md text-[15.5px] leading-relaxed text-[color:var(--parchment)]/75">
                {c.parents.intro}
              </p>
              <Link
                href="#pricing"
                className="mt-10 inline-flex items-center gap-2 border-b border-[color:var(--gold)]/60 pb-1 text-[color:var(--gold)] transition-colors hover:border-[color:var(--gold)]"
              >
                {c.parents.link}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            <div className="grid gap-px bg-[color:var(--parchment)]/15 sm:grid-cols-2 lg:col-span-7">
              {c.parents.pillars.map((p, i) => (
                <div key={p.title} className="bg-[color:var(--ink)] p-7">
                  <span className="font-mono text-xs text-[color:var(--gold)]">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 text-xl text-[color:var(--parchment)]">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-[color:var(--parchment)]/70">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="container mx-auto px-6 py-32">
        <header className="mb-16 text-center">
          <p className="eyebrow">{c.pricing.eyebrow}</p>
          <h2 className="display-lg mx-auto mt-4 max-w-3xl text-5xl md:text-6xl">
            {c.pricing.title1}
            <br />
            <span className="italic-wonk text-[color:var(--ember)]">
              {c.pricing.titleAccent}
            </span>{" "}
            {c.pricing.title2}
          </h2>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {c.pricing.tiers.map((t) => (
            <article
              key={t.name}
              className={`card-stamp relative flex flex-col p-8 transition-all ${
                t.featured
                  ? "border-[color:var(--ember)] shadow-[0_24px_60px_-30px_rgba(200,62,30,0.55)] md:-translate-y-4 md:scale-[1.02]"
                  : ""
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[color:var(--ember)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--primary-foreground)]">
                  {c.pricing.badge}
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl text-foreground">{t.name}</h3>
                {t.featured && (
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                    <path
                      d="M12 2l2 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"
                      fill="var(--ember)"
                    />
                  </svg>
                )}
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="display-lg text-5xl text-foreground">
                  {t.price}
                </span>
                <span className="eyebrow">{t.sub}</span>
              </div>
              <p className="mt-4 text-[14.5px] leading-relaxed text-foreground/65">
                {t.desc}
              </p>

              <div className="rule-ornament my-6">
                <svg width="10" height="10" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="4" fill="currentColor" />
                </svg>
              </div>

              <ul className="space-y-2.5 text-[14px] text-foreground/80">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      className="mt-0.5 shrink-0 text-[color:var(--ember)]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="#"
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-[var(--font-fraunces)] transition-all ${
                  t.featured
                    ? "bg-[color:var(--ember)] text-[color:var(--primary-foreground)] hover:-translate-y-[1px]"
                    : "border border-border text-foreground hover:border-[color:var(--ember)] hover:text-[color:var(--ember)]"
                }`}
              >
                {t.cta}
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-foreground/50">
          {c.pricing.footnote}
        </p>
      </section>

      <section className="container mx-auto px-6 pb-24 pt-8">
        <div className="card-stamp relative overflow-hidden px-8 py-20 text-center md:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <svg
              viewBox="0 0 400 200"
              preserveAspectRatio="none"
              className="h-full w-full text-[color:var(--gold)]"
            >
              <path
                d="M0 100 C 80 40, 160 160, 240 90 S 380 130, 400 80"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.6"
                strokeDasharray="3 4"
              />
              <path
                d="M0 130 C 80 80, 160 200, 240 120 S 380 160, 400 110"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.4"
                strokeDasharray="2 5"
              />
            </svg>
          </div>
          <p className="eyebrow relative">{c.finalCta.eyebrow}</p>
          <h2 className="display-xl relative mt-4 text-5xl md:text-7xl">
            {c.finalCta.title1}
            <br />
            <span className="italic-wonk text-[color:var(--ember)]">
              {c.finalCta.titleAccent}
            </span>
          </h2>
          <p className="relative mx-auto mt-6 max-w-xl text-[15.5px] leading-relaxed text-foreground/70">
            {c.finalCta.body}
          </p>
          <div className="relative mt-10 flex items-center justify-center gap-4">
            <Link href="#" className="btn-ember">
              {c.finalCta.cta1}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link href="#parents" className="btn-ghost-ink">
              {c.finalCta.cta2}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
