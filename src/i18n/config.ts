/**
 * Hero's Forge supports two locales at launch (PRD §6):
 *   - en (English; secondary)
 *   - az (Azerbaijani; primary market)
 *
 * Locale is resolved server-side from a cookie (see `request.ts`).
 * URLs stay locale-free — Hero's Forge is a mostly-authenticated app, so
 * per-locale URLs would buy us little SEO and force every route file
 * under an `[locale]` segment.
 */

export const LOCALES = ["en", "az"] as const;
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "heros-forge-ui-lang";

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "az";
}
