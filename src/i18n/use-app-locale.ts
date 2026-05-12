import { useLocale } from "next-intl";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * Safely narrows next-intl's `useLocale()` (typed as `string`) to our
 * canonical `Locale` union — `"en" | "az"`.
 *
 * Use this everywhere you need to index a locale-keyed dictionary that
 * still lives outside the messages bundle (e.g. `worlds.ts`, `badges.ts`).
 *
 * Works in both server and client components — `useLocale()` is
 * universal in next-intl. If `request.ts` ever yields a value outside
 * the union (it shouldn't, given the `isLocale` guard there), we fall
 * back to `DEFAULT_LOCALE` rather than silently indexing `undefined`.
 */
export function useAppLocale(): Locale {
  const raw = useLocale();
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}
