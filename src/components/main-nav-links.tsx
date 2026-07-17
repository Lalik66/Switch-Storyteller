"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";

const linkClasses =
  "text-sm text-foreground/75 transition-colors hover:text-foreground";

export function MainNavLinks({
  communityEnabled = false,
}: {
  communityEnabled?: boolean;
}) {
  const t = useTranslations("Nav");
  const { data: session } = useSession();

  return (
    <div className="hidden items-center gap-8 md:flex">
      <Link href="#worlds" className={linkClasses}>
        {t("worlds")}
      </Link>
      <Link href="#loop" className={linkClasses}>
        {t("loop")}
      </Link>
      <Link href="#parents" className={linkClasses}>
        {t("parents")}
      </Link>
      <Link href="#pricing" className={linkClasses}>
        {t("pricing")}
      </Link>

      {session && (
        <>
          <Link href="/parent/dashboard" className={linkClasses}>
            {t("dashboard")}
          </Link>
          <Link href="/stories" className={linkClasses}>
            {t("myStories")}
          </Link>
          <Link href="/children" className={linkClasses}>
            {t("children")}
          </Link>
          <Link href="/characters" className={linkClasses}>
            {t("characters")}
          </Link>
          {communityEnabled && (
            <Link href="/community" className={linkClasses}>
              {t("community")}
            </Link>
          )}
        </>
      )}
    </div>
  );
}
