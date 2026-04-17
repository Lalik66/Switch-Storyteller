"use client";

import { useLanguage } from "@/components/language-provider";
import { LANDING_COPY } from "@/lib/landing-copy";

export function LocalizedSkipLink() {
  const { lang } = useLanguage();
  const label = LANDING_COPY[lang].chrome.skipToContent;

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:border focus:bg-background focus:px-4 focus:py-2 focus:text-foreground"
    >
      {label}
    </a>
  );
}
