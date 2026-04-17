"use client";

import { useLanguage } from "@/components/language-provider";
import { LANDING_COPY } from "@/lib/landing-copy";

export function SiteHeaderBrand() {
  const { lang } = useLanguage();
  const ch = LANDING_COPY[lang].chrome;

  return (
    <span className="flex flex-col leading-none">
      <span className="eyebrow">{ch.brandEyebrow}</span>
      <span className="display-lg text-xl text-foreground">
        {ch.brandBefore} <em className="italic-wonk">{ch.brandAccent}</em>
      </span>
    </span>
  );
}
