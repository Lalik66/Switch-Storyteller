"use client";

import { useTranslations } from "next-intl";
import { useLanguage, type AppLang } from "@/components/language-provider";
import { updateUser, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const LANGS: { code: AppLang; label: string }[] = [
  { code: "en", label: "ENG" },
  { code: "az", label: "AZ" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const { data: session } = useSession();
  const t = useTranslations("LanguageSwitcher");

  const switchLang = (code: AppLang) => {
    setLang(code);
    // Signed-in parents also persist the choice to user.locale so
    // cookie-less contexts (digest cron, transactional emails) follow.
    // Fire-and-forget: the cookie is the UI's source of truth either way.
    if (session) {
      void updateUser({ locale: code }).catch(() => {});
    }
  };

  return (
    <div
      className="flex items-center rounded-full border border-border/80 p-0.5"
      role="group"
      aria-label={t("ariaGroup")}
    >
      {LANGS.map(({ code, label }) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchLang(code)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide transition-colors",
              active
                ? "bg-[color:var(--ember)] text-white shadow-sm"
                : "text-foreground/55 hover:text-foreground"
            )}
            aria-pressed={active}
            aria-label={code === "en" ? t("ariaEn") : t("ariaAz")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
