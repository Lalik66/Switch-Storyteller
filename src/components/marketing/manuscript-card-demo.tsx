import { getTranslations } from "next-intl/server";

export async function ManuscriptCardDemo() {
  const t = await getTranslations("Manuscript");
  const choices = t.raw("choices") as string[];

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -left-10 -top-10 z-20">
        <svg
          viewBox="0 0 140 140"
          className="h-28 w-28 text-[color:var(--ink)] slow-spin"
          aria-hidden="true"
        >
          <defs>
            <path
              id="circle"
              d="M70,70 m-54,0 a54,54 0 1,1 108,0 a54,54 0 1,1 -108,0"
            />
          </defs>
          <text
            fontFamily="var(--font-fraunces), Georgia, serif"
            fontSize="11"
            letterSpacing="3"
            fill="currentColor"
            fontStyle="italic"
          >
            <textPath href="#circle">{t("sealText")}</textPath>
          </text>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2l2.5 6.5L21 10l-5 4.5L17.5 21 12 17.5 6.5 21 8 14.5 3 10l6.5-1.5z"
              fill="var(--ember)"
            />
          </svg>
        </div>
      </div>

      <div className="absolute inset-0 -right-4 top-4 rotate-[3deg] rounded-[var(--radius)] border border-border bg-[color:var(--gold)]/30" />

      <div className="card-stamp relative rotate-[-1.5deg] p-7">
        <div className="flex items-center justify-between">
          <span className="eyebrow">{t("folioMeta")}</span>
          <span className="eyebrow text-[color:var(--ember)]">
            {t("liveBadge")}
          </span>
        </div>

        <p className="mt-5 font-[var(--font-newsreader)] text-[15.5px] leading-[1.7] text-foreground/90">
          {t("p1Before")}{" "}
          <span className="bg-[color:var(--gold)]/40 px-0.5">
            {t("p1Highlight")}
          </span>{" "}
          {t("p1After")}{" "}
          <em className="italic text-[color:var(--ember)]">
            &ldquo;{t("quote")}&rdquo;
          </em>{" "}
          {t("p1End")}
        </p>

        <div className="rule-ornament my-6">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"
              fill="currentColor"
            />
          </svg>
        </div>

        <p className="eyebrow mb-3">{t("question")}</p>
        <div className="space-y-2">
          {choices.map((choice, i) => (
            <button
              key={choice}
              type="button"
              className="group flex w-full items-center justify-between rounded-sm border border-border/80 bg-background/60 px-3 py-2.5 text-left text-[14px] text-foreground/85 transition-all hover:-translate-y-[1px] hover:border-[color:var(--ember)] hover:bg-[color:var(--gold)]/20"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-border text-[10px] font-medium text-foreground/60 group-hover:border-[color:var(--ember)] group-hover:text-[color:var(--ember)]">
                  {String.fromCharCode(97 + i)}
                </span>
                {choice}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="text-foreground/30 transition-all group-hover:translate-x-1 group-hover:text-[color:var(--ember)]"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between text-[11px] text-foreground/55">
          <span>{t("footerLeft")}</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--forest)]" />
            {t("footerRight")}
          </span>
        </div>
      </div>
    </div>
  );
}
