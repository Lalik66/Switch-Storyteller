"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const APP_LANGS = ["en", "az"] as const;
export type AppLang = (typeof APP_LANGS)[number];

const STORAGE_KEY = "heros-forge-ui-lang";
const LANG_EVENT = "heros-forge-lang-change";

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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LANG_EVENT));
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  /** SSR and first client paint stay `en` to avoid hydration mismatches. */
  const [lang, setLangState] = useState<AppLang>("en");

  useEffect(() => {
    const syncFromStorage = () => {
      const next = readStoredLang() ?? detectBrowserLang();
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
  }, [lang]);

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
