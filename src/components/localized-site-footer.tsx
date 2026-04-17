"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { LANDING_COPY } from "@/lib/landing-copy";

export function LocalizedSiteFooter() {
  const { lang } = useLanguage();
  const f = LANDING_COPY[lang].footer;
  const ch = LANDING_COPY[lang].chrome;

  return (
    <footer className="relative mt-32 border-t border-border/60">
      <div className="absolute left-1/2 -top-[18px] -translate-x-1/2">
        <svg
          width="120"
          height="36"
          viewBox="0 0 120 36"
          fill="none"
          className="text-[color:var(--ember)]"
          aria-hidden="true"
        >
          <path
            d="M2 18 C 20 18, 30 6, 50 18 S 80 30, 98 18"
            stroke="currentColor"
            strokeWidth="1.25"
            fill="none"
          />
          <circle
            cx="60"
            cy="18"
            r="6"
            fill="var(--background)"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <circle cx="60" cy="18" r="2" fill="currentColor" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
          <circle cx="108" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <p className="display-lg text-3xl leading-none text-foreground">
              {ch.brandBefore}{" "}
              <em className="italic-wonk">{ch.brandAccent}</em>
            </p>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-foreground/70">
              {f.blurb}
            </p>
            <p className="eyebrow mt-6">{f.tagline}</p>
          </div>

          <FooterCol title={f.col1Title} links={f.links1} />
          <FooterCol title={f.col2Title} links={f.links2} />
          <FooterCol title={f.col3Title} links={f.links3} />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/50 pt-6 text-xs text-foreground/55 md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {f.copyright}
          </p>
          <p className="eyebrow">{f.finePrint}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <p className="eyebrow mb-4">{title}</p>
      <ul className="space-y-2.5 text-[15px]">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              className="text-foreground/75 transition-colors hover:text-[color:var(--ember)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
