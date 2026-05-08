import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config";

/**
 * Resolve the active locale for a request from a cookie set by the
 * language switcher. Falls back to DEFAULT_LOCALE on first visit;
 * Accept-Language sniffing is intentionally avoided so the cookie is
 * the single source of truth (the existing `LanguageProvider` already
 * does first-visit browser-language detection on the client and then
 * writes the cookie via `persistLang`).
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(fromCookie) ? fromCookie : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
