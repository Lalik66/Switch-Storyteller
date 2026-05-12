import Link from "next/link";
import { getTranslations } from "next-intl/server";

// Hrefs live in code, not the messages bundle: they're anchor IDs / routes,
// not translatable copy. If a developer renames `#loop`, they update it
// here once instead of in every locale's JSON. Translators only ever touch
// the matching label arrays in `messages/{en,az}.json` under `Footer.colNLabels`.
const COL1_HREFS = ["#loop", "#worlds", "#sample"] as const;
const COL2_HREFS = ["#parents", "#safety", "#pricing"] as const;
const COL3_HREFS = ["#", "#", "#"] as const;

export async function LocalizedSiteFooter() {
  const tFooter = await getTranslations("Footer");
  const tBrand = await getTranslations("Brand");

  // `t.raw()` returns the structured value (an array of label strings)
  // verbatim from the JSON, bypassing ICU formatting.
  const col1Labels = tFooter.raw("col1Labels") as string[];
  const col2Labels = tFooter.raw("col2Labels") as string[];
  const col3Labels = tFooter.raw("col3Labels") as string[];

  return (
    <footer className="relative mt-32 border-t border-border/60">
      <div className="absolute left-1/2 -top-[18px] -translate-x-1/2">
        <svg
          width="120"
          height="36"
          viewBox="0 0 120 36"
          fill="none"
          className="text-[color:var(--ember)]"
          aria-hidden="true"
        >
          <path
            d="M2 18 C 20 18, 30 6, 50 18 S 80 30, 98 18"
            stroke="currentColor"
            strokeWidth="1.25"
            fill="none"
          />
          <circle
            cx="60"
            cy="18"
            r="6"
            fill="var(--background)"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <circle cx="60" cy="18" r="2" fill="currentColor" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
          <circle cx="108" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <p className="display-lg text-3xl leading-none text-foreground">
              {tBrand("before")}{" "}
              <em className="italic-wonk">{tBrand("accent")}</em>
            </p>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-foreground/70">
              {tFooter("blurb")}
            </p>
            <p className="eyebrow mt-6">{tFooter("tagline")}</p>
          </div>

          <FooterCol
            title={tFooter("col1Title")}
            labels={col1Labels}
            hrefs={COL1_HREFS}
          />
          <FooterCol
            title={tFooter("col2Title")}
            labels={col2Labels}
            hrefs={COL2_HREFS}
          />
          <FooterCol
            title={tFooter("col3Title")}
            labels={col3Labels}
            hrefs={COL3_HREFS}
          />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/50 pt-6 text-xs text-foreground/55 md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {tFooter("copyright")}
          </p>
          <p className="eyebrow">{tFooter("finePrint")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  labels,
  hrefs,
}: {
  title: string;
  labels: string[];
  hrefs: readonly string[];
}) {
  return (
    <div>
      <p className="eyebrow mb-4">{title}</p>
      <ul className="space-y-2.5 text-[15px]">
        {labels.map((label, i) => (
          <li key={label}>
            <Link
              href={hrefs[i] ?? "#"}
              className="text-foreground/75 transition-colors hover:text-[color:var(--ember)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
