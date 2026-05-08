"use client";

import Link from "next/link";
import { useLanguage, type AppLang } from "@/components/language-provider";
import { useSession } from "@/lib/auth-client";

const COPY: Record<
  AppLang,
  {
    worlds: string;
    loop: string;
    parents: string;
    pricing: string;
    dashboard: string;
    myStories: string;
    children: string;
    characters: string;
    community: string;
  }
> = {
  en: {
    worlds: "Worlds",
    loop: "How it works",
    parents: "For parents",
    pricing: "Pricing",
    dashboard: "Dashboard",
    myStories: "My Stories",
    children: "Children",
    characters: "Characters",
    community: "Community",
  },
  az: {
    worlds: "Dünyalar",
    loop: "Necə işləyir",
    parents: "Valideynlər üçün",
    pricing: "Qiymətlər",
    dashboard: "İdarə paneli",
    myStories: "Hekayələrim",
    children: "Uşaqlar",
    characters: "Xarakterlər",
    community: "İcma",
  },
};

const linkClasses =
  "text-sm text-foreground/75 transition-colors hover:text-foreground";

export function MainNavLinks() {
  const { lang } = useLanguage();
  const { data: session } = useSession();
  const t = COPY[lang];

  return (
    <div className="hidden items-center gap-8 md:flex">
      <Link href="#worlds" className={linkClasses}>
        {t.worlds}
      </Link>
      <Link href="#loop" className={linkClasses}>
        {t.loop}
      </Link>
      <Link href="#parents" className={linkClasses}>
        {t.parents}
      </Link>
      <Link href="#pricing" className={linkClasses}>
        {t.pricing}
      </Link>

      {session && (
        <>
          <Link href="/parent/dashboard" className={linkClasses}>
            {t.dashboard}
          </Link>
          <Link href="/stories" className={linkClasses}>
            {t.myStories}
          </Link>
          <Link href="/children" className={linkClasses}>
            {t.children}
          </Link>
          <Link href="/characters" className={linkClasses}>
            {t.characters}
          </Link>
          <Link href="/community" className={linkClasses}>
            {t.community}
          </Link>
        </>
      )}
    </div>
  );
}
