import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAppLocale } from "@/i18n/use-app-locale";

function Proof({
  icon,
  children,
}: {
  icon: "shield" | "eye" | "feather";
  children: React.ReactNode;
}) {
  const paths: Record<typeof icon, string> = {
    shield: "M12 3l8 3v6c0 4.5-3.4 8.5-8 9-4.6-.5-8-4.5-8-9V6l8-3z",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z",
    feather: "M20 4a6 6 0 00-8 0L5 11v7h7l7-7a6 6 0 000-7zM5 18l5-5",
  };
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[color:var(--ember)]"
      >
        <path d={paths[icon]} />
      </svg>
      <span className="eyebrow !tracking-[0.18em]">{children}</span>
    </span>
  );
}

// EN and AZ have meaningfully different title shapes (3 lines + italic mid-
// word vs. 2 lines + italic 2nd line). The locale-specific layouts are
// modelled as separate `Hero.titleEn` / `Hero.titleAz` sub-namespaces in
// the messages bundle — eliminates dead empty-string keys on the other
// locale and makes the divergence explicit in the JSON shape.
function HeroTitleEn({
  line1,
  line2,
  accent,
  line3,
}: {
  line1: string;
  line2: string;
  accent: string;
  line3: string;
}) {
  return (
    <h1
      className="display-xl mt-6 text-[clamp(3.2rem,8vw,7.2rem)] text-foreground rise"
      style={{ animationDelay: "120ms" }}
    >
      {line1}
      <br />
      {line2}
      <br />
      <span className="italic-wonk text-[color:var(--ember)]">{accent}</span>{" "}
      {line3}
    </h1>
  );
}

function HeroTitleAz({
  line1,
  accent,
}: {
  line1: string;
  accent: string;
}) {
  return (
    <h1
      className="display-xl mt-6 text-[clamp(3.2rem,8vw,7.2rem)] text-foreground rise"
      style={{ animationDelay: "120ms" }}
    >
      {line1}
      <br />
      <span className="italic-wonk text-[color:var(--ember)]">{accent}</span>
    </h1>
  );
}

// Sync server component on purpose: `useTranslations` + `useAppLocale`
// are universal hooks (server + client) and avoid the React rules-of-hooks
// trap that fires when an `async` function tries to call a hook.
// Reach for `getTranslations` / `getLocale` from `next-intl/server` only
// when the function MUST be async for some other reason (e.g. data fetch).
export function HomeHeroLead() {
  const t = useTranslations("Hero");
  const locale = useAppLocale();

  return (
    <div className="lg:col-span-7">
      <p className="eyebrow rise" style={{ animationDelay: "0ms" }}>
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--ember)] align-middle" />
        {"  "}
        {t("eyebrow")}
      </p>

      {locale === "az" ? (
        <HeroTitleAz
          line1={t("titleAz.line1")}
          accent={t("titleAz.accent")}
        />
      ) : (
        <HeroTitleEn
          line1={t("titleEn.line1")}
          line2={t("titleEn.line2")}
          accent={t("titleEn.accent")}
          line3={t("titleEn.line3")}
        />
      )}

      <p
        className="mt-8 max-w-xl text-[1.1rem] leading-relaxed text-foreground/75 rise"
        style={{ animationDelay: "240ms" }}
      >
        {t("body")}
      </p>

      <div
        className="mt-10 flex flex-wrap items-center gap-4 rise"
        style={{ animationDelay: "360ms" }}
      >
        <Link href="#worlds" className="btn-ember">
          {t("ctaTale")}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <Link href="#parents" className="btn-ghost-ink">
          {t("ctaParents")}
        </Link>
      </div>

      <div
        className="mt-12 flex flex-wrap items-center gap-6 text-xs text-foreground/55 rise"
        style={{ animationDelay: "480ms" }}
      >
        <Proof icon="shield">{t("proofShield")}</Proof>
        <Proof icon="eye">{t("proofEye")}</Proof>
        <Proof icon="feather">{t("proofFeather")}</Proof>
      </div>
    </div>
  );
}
