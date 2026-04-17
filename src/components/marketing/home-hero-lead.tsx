"use client";

import Link from "next/link";
import { useLanguage, type AppLang } from "@/components/language-provider";

const COPY: Record<
  AppLang,
  {
    eyebrow: string;
    body: string;
    ctaTale: string;
    ctaParents: string;
    proofShield: string;
    proofEye: string;
    proofFeather: string;
  }
> = {
  en: {
    eyebrow: "A studio for young authors · Ages 7–12",
    body: "The Hero's Forge is an illustrated storytelling studio where children co-write magical adventures with a gentle AI storyteller. Every page is theirs. Every choice matters. Every tale becomes a real, printed book they can hold.",
    ctaTale: "Begin a tale",
    ctaParents: "For parents",
    proofShield: "COPPA compliant",
    proofEye: "Human-reviewed",
    proofFeather: "Ad-free, forever",
  },
  az: {
    eyebrow: "Gənc müəlliflər studiyası · 7–12 yaş",
    body: "Qəhrəmanın Döyməxanası uşaqların yumşaq bir süni nağılçı ilə sehrli macəralar birgə yazdığı təsvirli studiyadır. Hər səhifə onlarındır. Hər seçim vacibdir. Hər nağıl əllərində tuta biləcəkləri əsl çap kitabına çevrilir.",
    ctaTale: "Nağıla başla",
    ctaParents: "Valideynlər üçün",
    proofShield: "COPPA uyğun",
    proofEye: "İnsan nəzarəti",
    proofFeather: "Reklamsız, həmişəlik",
  },
};

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
    feather:
      "M20 4a6 6 0 00-8 0L5 11v7h7l7-7a6 6 0 000-7zM5 18l5-5",
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

function HeroTitle({ lang }: { lang: AppLang }) {
  if (lang === "az") {
    return (
      <h1
        className="display-xl mt-6 text-[clamp(3.2rem,8vw,7.2rem)] text-foreground rise"
        style={{ animationDelay: "120ms" }}
      >
        Sənin hekayələrin
        <br />
        <span className="italic-wonk text-[color:var(--ember)]">
          qəhrəman yaradır
        </span>
      </h1>
    );
  }
  return (
    <h1
      className="display-xl mt-6 text-[clamp(3.2rem,8vw,7.2rem)] text-foreground rise"
      style={{ animationDelay: "120ms" }}
    >
      Where young
      <br />
      heroes are
      <br />
      <span className="italic-wonk text-[color:var(--ember)]">forged</span> in
      ink.
    </h1>
  );
}

export function HomeHeroLead() {
  const { lang } = useLanguage();
  const t = COPY[lang];

  return (
    <div className="lg:col-span-7">
      <p className="eyebrow rise" style={{ animationDelay: "0ms" }}>
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--ember)] align-middle" />
        {"  "}
        {t.eyebrow}
      </p>

      <HeroTitle lang={lang} />

      <p
        className="mt-8 max-w-xl text-[1.1rem] leading-relaxed text-foreground/75 rise"
        style={{ animationDelay: "240ms" }}
      >
        {t.body}
      </p>

      <div
        className="mt-10 flex flex-wrap items-center gap-4 rise"
        style={{ animationDelay: "360ms" }}
      >
        <Link href="#worlds" className="btn-ember">
          {t.ctaTale}
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
          {t.ctaParents}
        </Link>
      </div>

      <div
        className="mt-12 flex flex-wrap items-center gap-6 text-xs text-foreground/55 rise"
        style={{ animationDelay: "480ms" }}
      >
        <Proof icon="shield">{t.proofShield}</Proof>
        <Proof icon="eye">{t.proofEye}</Proof>
        <Proof icon="feather">{t.proofFeather}</Proof>
      </div>
    </div>
  );
}
