"use client";

/**
 * Drafting Buddy — 3-question intake for a new tale.
 *
 * PRD references: §4.1 (onboarding flow), §5 (story creation intake),
 * §6 (world selection), §11 (bilingual EN/AZ copy). See
 * `.claude/plans/sequential-bubbling-horizon.md`.
 *
 * Phase 1 scope note: this page posts to a placeholder `/api/story`
 * endpoint that is NOT part of Phase 1 for any agent. The POST is left
 * behind a TODO so that the sibling API agent can wire it up later.
 */

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage, type AppLang } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
// NOTE: `@/lib/worlds` is owned by the worlds-agent. Types below mirror
// the expected shape documented in the PRD. These imports will resolve
// cleanly after the sibling agent's file lands on master.
import { WORLDS, type World } from "@/lib/worlds";

/* ── Localized copy (Phase 1 inline tables) ─────────────────────────── */

const COPY: Record<
  AppLang,
  {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    intro: string;
    stepLabel: (n: number, total: number) => string;
    step1Label: string;
    step1Hint: string;
    step1Placeholder: string;
    step2Label: string;
    step2Hint: string;
    step3Label: string;
    step3Hint: string;
    step3Placeholder: string;
    next: string;
    back: string;
    begin: string;
    missingName: string;
    missingWorld: string;
    missingProblem: string;
    submitFailed: string;
    lockedEyebrow: string;
    lockedTitle: string;
    lockedTitleAccent: string;
    lockedBody: string;
    lockedCta: string;
    loading: string;
  }
> = {
  en: {
    eyebrow: "\u00a7 I \u00b7 A new tale",
    titleLead: "Three quiet",
    titleAccent: "questions.",
    intro:
      "The drafting buddy will shape your hero, pick a world, and listen to the trouble they face. Nothing is saved until you press Begin.",
    stepLabel: (n, total) => `Question ${n} of ${total}`,
    step1Label: "What is your hero\u2019s name?",
    step1Hint: "A first name is plenty. You can change it later.",
    step1Placeholder: "Maren",
    step2Label: "Where does the tale begin?",
    step2Hint: "Pick a world. Each has its own mood and light.",
    step3Label: "What trouble finds your hero?",
    step3Hint: "A sentence or two is enough \u2014 the storyteller will do the rest.",
    step3Placeholder:
      "A silver fox keeps tapping at the window after dusk, but no one else can see it\u2026",
    next: "Next",
    back: "Back",
    begin: "Begin the tale",
    missingName: "Your hero needs a name first.",
    missingWorld: "Pick a world to set the scene.",
    missingProblem: "Describe the trouble, even briefly.",
    submitFailed: "The scribe stumbled. Try again in a moment.",
    lockedEyebrow: "\u00a7 Threshold \u00b7 A locked folio",
    lockedTitle: "This page is",
    lockedTitleAccent: "by invitation.",
    lockedBody:
      "Sign in to begin a new tale. The drafting buddy will be waiting for you.",
    lockedCta: "Return to the workshop",
    loading: "Loading the quill\u2026",
  },
  az: {
    eyebrow: "\u00a7 I \u00b7 Yeni nağıl",
    titleLead: "Üç sakit",
    titleAccent: "sual.",
    intro:
      "Layihə dostu qəhrəmanını yaradacaq, bir dünya seçəcək və qarşılaşdığı çətinliyi dinləyəcək. Başla düyməsinə basana qədər heç nə saxlanmır.",
    stepLabel: (n, total) => `${total}-dən ${n}-ci sual`,
    step1Label: "Qəhrəmanının adı nədir?",
    step1Hint: "Yalnız ad bəsdir. Sonra dəyişə bilərsən.",
    step1Placeholder: "Maren",
    step2Label: "Nağıl harada başlayır?",
    step2Hint: "Bir dünya seç. Hər birinin öz əhvalı və işığı var.",
    step3Label: "Qəhrəmanını hansı dərd tapır?",
    step3Hint: "Bir-iki cümlə kifayətdir \u2014 qalanını nağılçı edəcək.",
    step3Placeholder:
      "Qaranlıq düşəndən sonra gümüş bir tülkü pəncərəyə toxunur, amma onu heç kim görmür\u2026",
    next: "Növbəti",
    back: "Geri",
    begin: "Nağıla başla",
    missingName: "Qəhrəmanına əvvəl ad lazımdır.",
    missingWorld: "Səhnəni qurmaq üçün bir dünya seç.",
    missingProblem: "Dərdi qısa da olsa təsvir et.",
    submitFailed: "Yazıçı büdrədi. Bir az sonra yenə cəhd et.",
    lockedEyebrow: "\u00a7 Astana \u00b7 Bağlı folio",
    lockedTitle: "Bu səhifə",
    lockedTitleAccent: "dəvətlidir.",
    lockedBody:
      "Yeni nağıla başlamaq üçün daxil ol. Layihə dostu səni gözləyir.",
    lockedCta: "Emalatxanaya qayıt",
    loading: "Lələk yüklənir\u2026",
  },
};

/* ── Component ──────────────────────────────────────────────────────── */

const TOTAL_STEPS = 3;

export default function NewStoryPage() {
  const { data: session, isPending } = useSession();
  const { lang } = useLanguage();
  const t = COPY[lang];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [heroName, setHeroName] = useState("");
  const [worldKey, setWorldKey] = useState<string>("");
  const [problem, setProblem] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // `WORLDS` is owned by the worlds-agent. Cast once locally so the rest
  // of the component stays strongly typed against the expected `World`.
  const worlds = useMemo<ReadonlyArray<World>>(
    () => (WORLDS ?? []) as ReadonlyArray<World>,
    []
  );

  if (isPending) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="eyebrow">{t.loading}</p>
      </div>
    );
  }

  if (!session) {
    return <LockedFolio t={t} />;
  }

  const goNext = () => {
    if (step === 1) {
      if (!heroName.trim()) {
        toast.error(t.missingName);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!worldKey) {
        toast.error(t.missingWorld);
        return;
      }
      setStep(3);
      return;
    }
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!heroName.trim()) {
      setStep(1);
      toast.error(t.missingName);
      return;
    }
    if (!worldKey) {
      setStep(2);
      toast.error(t.missingWorld);
      return;
    }
    if (!problem.trim()) {
      toast.error(t.missingProblem);
      return;
    }

    setSubmitting(true);
    try {
      // TODO(phase-2, api-agent): POST /api/story is NOT in Phase 1 scope
      // for any agent. The sibling API agent will own this route. For now
      // this fetch is intentionally unguarded — it will 404 in dev — so
      // the shape is visible in the network tab for the next agent.
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroName: heroName.trim(),
          worldKey,
          problem: problem.trim(),
          lang,
        }),
      });

      if (!res.ok) {
        throw new Error(`Story create failed: ${res.status}`);
      }

      const json = (await res.json()) as { storyId?: string };
      if (json.storyId) {
        window.location.href = `/story/${json.storyId}`;
      }
    } catch (err) {
      console.error(err);
      toast.error(t.submitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 className="display-lg mt-4 text-4xl md:text-5xl">
              {t.titleLead}
              <br />
              <span className="italic-wonk text-[color:var(--ember)]">
                {t.titleAccent}
              </span>
            </h1>
            <p className="mt-5 max-w-xl font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
              {t.intro}
            </p>
          </div>
        </header>

        <article className="card-stamp p-6 md:p-8">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-foreground/55">
              {t.stepLabel(step, TOTAL_STEPS)}
            </p>
            <StepDots current={step} total={TOTAL_STEPS} />
          </div>

          <div className="rule-ornament my-5">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"
                fill="currentColor"
              />
            </svg>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {step === 1 && (
              <div className="flex flex-col gap-3">
                <Label
                  htmlFor="hero-name"
                  className="font-[var(--font-fraunces)] text-[15px]"
                >
                  {t.step1Label}
                </Label>
                <Input
                  id="hero-name"
                  value={heroName}
                  onChange={(e) => setHeroName(e.target.value)}
                  placeholder={t.step1Placeholder}
                  maxLength={40}
                  autoFocus
                  className="font-[var(--font-newsreader)] text-[16px]"
                />
                <p className="font-[var(--font-newsreader)] text-[14px] italic text-foreground/55">
                  {t.step1Hint}
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-[var(--font-fraunces)] text-[15px] text-foreground">
                    {t.step2Label}
                  </p>
                  <p className="mt-1 font-[var(--font-newsreader)] text-[14px] italic text-foreground/55">
                    {t.step2Hint}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {worlds.map((w, idx) => (
                    <WorldTile
                      key={w.key}
                      world={w}
                      index={idx}
                      selected={worldKey === w.key}
                      onSelect={() => setWorldKey(w.key)}
                      lang={lang}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-3">
                <Label
                  htmlFor="hero-problem"
                  className="font-[var(--font-fraunces)] text-[15px]"
                >
                  {t.step3Label}
                </Label>
                <Textarea
                  id="hero-problem"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder={t.step3Placeholder}
                  rows={5}
                  maxLength={500}
                  autoFocus
                  className="font-[var(--font-newsreader)] text-[15.5px] leading-relaxed"
                />
                <p className="font-[var(--font-newsreader)] text-[14px] italic text-foreground/55">
                  {t.step3Hint}
                </p>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                disabled={step === 1 || submitting}
                className="eyebrow"
              >
                {t.back}
              </Button>

              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={goNext}
                  className="btn-ember justify-center"
                >
                  {t.next}
                  <ArrowRight />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="btn-ember justify-center disabled:opacity-50"
                >
                  {submitting ? t.loading : t.begin}
                  {!submitting && <ArrowRight />}
                </Button>
              )}
            </div>
          </form>
        </article>
      </div>
    </section>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i + 1 <= current;
        return (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full transition-colors ${
              filled
                ? "bg-[color:var(--ember)]"
                : "bg-[color:var(--border)]"
            }`}
          />
        );
      })}
    </div>
  );
}

/**
 * Assign a deterministic tone color per world `key`. The sibling worlds
 * manifest does not expose tone colors directly, so we map the six
 * Phase 1 worlds onto the brand palette here. Unknown keys fall back to
 * `--forest` — safe because the tone is decorative only.
 */
const WORLD_TONES: Readonly<Record<string, string>> = {
  "enchanted-forest": "var(--forest)",
  "space-station": "var(--dusk)",
  "underwater-kingdom": "var(--forest)",
  "dragon-mountain": "var(--ember)",
  "desert-oasis": "var(--gold)",
  "cloud-city": "var(--dusk)",
};

function WorldTile({
  world,
  index,
  selected,
  onSelect,
  lang,
}: {
  world: World;
  index: number;
  selected: boolean;
  onSelect: () => void;
  lang: AppLang;
}) {
  const tone = WORLD_TONES[world.key] ?? "var(--forest)";
  const title = world.name[lang];
  const tagline = world.description[lang];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group card-stamp relative overflow-hidden p-0 text-left transition-all duration-500 hover:-translate-y-1 ${
        selected
          ? "border-[color:var(--ember)] shadow-[0_18px_40px_-22px_rgba(200,62,30,0.55)]"
          : ""
      }`}
    >
      <div
        className="relative aspect-[4/3] w-full overflow-hidden"
        style={{
          color: tone,
          background: `color-mix(in oklch, ${tone} 14%, var(--card))`,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full transition-transform duration-[1.2s] group-hover:scale-[1.06]"
          aria-hidden="true"
        >
          <circle cx="50" cy="55" r="22" fill="currentColor" opacity="0.18" />
          <path
            d="M10 80 Q30 60 50 80 T90 80"
            stroke="currentColor"
            strokeWidth="1.25"
            fill="none"
            opacity="0.55"
          />
          <circle cx="28" cy="30" r="1.2" fill="currentColor" />
          <circle cx="70" cy="24" r="1.2" fill="currentColor" />
          <circle cx="55" cy="14" r="1.2" fill="currentColor" />
        </svg>
        <span className="absolute left-4 top-4 rounded-full border border-foreground/15 bg-background/70 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground/70 backdrop-blur">
          No. {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-4 px-5 py-4">
        <div>
          <h3 className="text-xl leading-tight text-foreground">{title}</h3>
          {tagline && (
            <p className="eyebrow mt-1 !tracking-[0.18em]">{tagline}</p>
          )}
        </div>
        <ArrowRight />
      </div>
    </button>
  );
}

function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-current"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockedFolio({ t }: { t: (typeof COPY)[AppLang] }) {
  return (
    <section className="container mx-auto px-6 py-32 md:py-40">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">{t.lockedEyebrow}</p>
        <h1 className="display-xl mt-6 text-[clamp(2.8rem,6vw,4.8rem)] leading-[0.95]">
          {t.lockedTitle}&nbsp;
          <span className="italic-wonk text-[color:var(--ember)]">
            {t.lockedTitleAccent}
          </span>
        </h1>
        <div className="rule-ornament my-8 mx-auto max-w-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"
              fill="currentColor"
            />
          </svg>
        </div>
        <p className="mx-auto max-w-md font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
          {t.lockedBody}
        </p>
        <div className="mt-10 flex justify-center">
          <Link href="/dashboard" className="btn-ghost-ink">
            {t.lockedCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
