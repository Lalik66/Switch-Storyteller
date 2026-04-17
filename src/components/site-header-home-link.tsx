"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { SiteHeaderBrand } from "@/components/site-header-brand";
import { LANDING_COPY } from "@/lib/landing-copy";

export function SiteHeaderHomeLink() {
  const { lang } = useLanguage();
  const aria = LANDING_COPY[lang].chrome.ariaHome;

  return (
    <Link href="/" className="group flex items-center gap-3" aria-label={aria}>
      <span className="relative inline-flex h-10 w-10 items-center justify-center">
        <svg
          viewBox="0 0 40 40"
          className="h-10 w-10 text-[color:var(--ember)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition-transform duration-500 group-hover:-rotate-6"
          aria-hidden="true"
        >
          <circle cx="20" cy="20" r="17" fill="currentColor" />
          <circle
            cx="20"
            cy="20"
            r="15"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeDasharray="2 3"
          />
          <text
            x="20"
            y="26"
            textAnchor="middle"
            fontFamily="var(--font-fraunces), Georgia, serif"
            fontSize="18"
            fontStyle="italic"
            fill="#fff"
            fontWeight="500"
          >
            H
          </text>
        </svg>
      </span>
      <SiteHeaderBrand />
    </Link>
  );
}
