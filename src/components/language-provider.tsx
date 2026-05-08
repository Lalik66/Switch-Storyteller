"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";

export const APP_LANGS = ["en", "az"] as const;
export type AppLang = (typeof APP_LANGS)[number];

const STORAGE_KEY = LOCALE_COOKIE;
const LANG_EVENT = "heros-forge-lang-change";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year, in seconds.

type LanguageContextValue = {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  toggleLang: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLang(): AppLang | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "en" || v === "az") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function readCookieLang(): AppLang | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${STORAGE_KEY}=(en|az)(?:;|$)`),
  );
  return (match?.[1] as AppLang | undefined) ?? null;
}

function detectBrowserLang(): AppLang {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("az") ? "az" : "en";
}

function persistLang(lang: AppLang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  // Also write a cookie so server components (next-intl) read the same locale.
  if (typeof document !== "undefined") {
    document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LANG_EVENT));
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialise from next-intl's server-resolved locale so SSR and first client
  // paint agree, and so `useLanguage()` consumers don't flash the default
  // locale for AZ users. Falls back to "en" if next-intl somehow yields a
  // value outside our enum (defensive — shouldn't happen given config.ts).
  const serverLocale = useLocale();
  const initialLang: AppLang = isLocale(serverLocale) ? serverLocale : "en";
  const [lang, setLangState] = useState<AppLang>(initialLang);
  const router = useRouter();
  /** Tracks the lang at last server render so we only refresh on real change. */
  const lastSyncedRef = useRef<AppLang>(initialLang);

  useEffect(() => {
    const syncFromStorage = () => {
      // Cookie is the canonical source — written by both this provider and the
      // server. localStorage is a legacy mirror; browser-language is the cold-
      // start fallback when neither is set.
      const next =
        readCookieLang() ?? readStoredLang() ?? detectBrowserLang();
      setLangState((prev) => (prev === next ? prev : next));
    };
    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(LANG_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(LANG_EVENT, syncFromStorage);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "az" ? "az" : "en";
    // First mount: align cookie with whatever we resolved (covers the case
    // where a returning visitor has localStorage='az' but no cookie yet).
    if (typeof document !== "undefined" && readCookieLang() !== lang) {
      document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    }
    // If the resolved locale differs from what the server rendered with,
    // ask Next to refetch server components so next-intl picks up the cookie.
    if (lastSyncedRef.current !== lang) {
      lastSyncedRef.current = lang;
      router.refresh();
    }
  }, [lang, router]);

  const setLang = useCallback((next: AppLang) => {
    persistLang(next);
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "en" ? "az" : "en";
      persistLang(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, toggleLang }),
    [lang, setLang, toggleLang]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
