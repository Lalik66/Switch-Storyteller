"use client";

/**
 * Drafting Buddy — 3-question intake for a new tale.
 *
 * PRD references: §4.1 (onboarding flow), §5 (story creation intake),
 * §6 (world selection), §11 (bilingual EN/AZ copy).
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppLocale } from "@/i18n/use-app-locale";
import { useSession } from "@/lib/auth-client";
// NOTE: `@/lib/worlds` is owned by the worlds-agent. Types below mirror
// the expected shape documented in the PRD. These imports will resolve
// cleanly after the sibling agent's file lands on master.
import { WORLDS, type World } from "@/lib/worlds";

/**
 * Minimal shape of a row returned by `GET /api/children`. The route
 * serializes `childProfile` directly, so additional fields exist on the
 * wire — we only narrow to what this page renders/consumes.
 */
type ChildProfile = {
  id: string;
  displayName: string;
  age: number;
};

/** Translator function for a fixed messages namespace. */
type Translator = ReturnType<typeof useTranslations>;

/* ── Component ──────────────────────────────────────────────────────── */

const TOTAL_STEPS = 3;

export default function NewStoryPage() {
  const { data: session, isPending } = useSession();
  const lang = useAppLocale();
  const t = useTranslations("StoryNew");
  const tWorlds = useTranslations("Worlds");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [heroName, setHeroName] = useState("");
  const [worldKey, setWorldKey] = useState<string>("");
  const [problem, setProblem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [childProfileId, setChildProfileId] = useState<string>("");

  // Fetch the parent's child profiles once a session is available. The
  // picker in Step 1 only renders when there is more than one child; for
  // single-child families we auto-select silently so the UI stays calm.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/children");
        if (!res.ok) return;
        const rows = (await res.json()) as ChildProfile[];
        if (cancelled) return;
        setChildren(rows);
        if (rows.length === 1 && rows[0]) {
          setChildProfileId(rows[0].id);
        }
      } catch (err) {
        // Non-fatal: the API falls back to the first child when the id
        // is omitted, so the form remains usable even if this fetch
        // fails in a flaky-network scenario.
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // `WORLDS` is owned by the worlds-agent. Cast once locally so the rest
  // of the component stays strongly typed against the expected `World`.
  const worlds = useMemo<ReadonlyArray<World>>(
    () => (WORLDS ?? []) as ReadonlyArray<World>,
    []
  );

  if (isPending) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="eyebrow">{t("loading")}</p>
      </div>
    );
  }

  if (!session) {
    return <LockedFolio t={t} />;
  }

  const goNext = () => {
    if (step === 1) {
      if (!heroName.trim()) {
        toast.error(t("missingName"));
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!worldKey) {
        toast.error(t("missingWorld"));
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
      toast.error(t("missingName"));
      return;
    }
    if (!worldKey) {
      setStep(2);
      toast.error(t("missingWorld"));
      return;
    }
    if (!problem.trim()) {
      toast.error(t("missingProblem"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroName: heroName.trim(),
          worldKey,
          problem: problem.trim(),
          lang,
          // Only include when explicitly selected; omitting preserves
          // backward-compatible single-child fallback on the server.
          ...(childProfileId ? { childProfileId } : {}),
        }),
      });

      if (!res.ok) {
        // Surface the rate-limit message as a friendly toast rather than
        // throwing a stack trace into the dev overlay.
        if (res.status === 429) {
          const body = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          toast.error(body.message ?? t("rateLimited"));
          return;
        }
        // Generic non-OK: log the body for debugging, show generic toast.
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        console.warn("[story/new] create non-ok", res.status, body);
        toast.error(body.message ?? t("submitFailed"));
        return;
      }

      const json = (await res.json()) as { storyId?: string };
      if (json.storyId) {
        window.location.href = `/story/${json.storyId}`;
      }
    } catch (err) {
      console.error(err);
      toast.error(t("submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <div>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="display-lg mt-4 text-4xl md:text-5xl">
              {t("titleLead")}
              <br />
              <span className="italic-wonk text-[color:var(--ember)]">
                {t("titleAccent")}
              </span>
            </h1>
            <p className="mt-5 max-w-xl font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
              {t("intro")}
            </p>
          </div>
        </header>

        <article className="card-stamp p-6 md:p-8">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-foreground/55">
              {t("stepLabel", { n: step, total: TOTAL_STEPS })}
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
              <div className="flex flex-col gap-6">
                {children.length > 1 && (
                  <div className="flex flex-col gap-3">
                    <p className="font-[var(--font-fraunces)] text-[15px] text-foreground">
                      {t("step0Label")}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {children.map((c) => {
                        const selected = childProfileId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setChildProfileId(c.id)}
                            aria-pressed={selected}
                            className={`card-stamp p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                              selected
                                ? "border-[color:var(--ember)] shadow-[0_14px_30px_-20px_rgba(200,62,30,0.55)]"
                                : ""
                            }`}
                          >
                            <p className="font-[var(--font-fraunces)] text-[16px] text-foreground">
                              {c.displayName}
                            </p>
                            <p className="eyebrow mt-1 text-foreground/55">
                              {c.age}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="font-[var(--font-newsreader)] text-[14px] italic text-foreground/55">
                      {t("step0Hint")}
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-3">
                <Label
                  htmlFor="hero-name"
                  className="font-[var(--font-fraunces)] text-[15px]"
                >
                  {t("step1Label")}
                </Label>
                <Input
                  id="hero-name"
                  value={heroName}
                  onChange={(e) => setHeroName(e.target.value)}
                  placeholder={t("step1Placeholder")}
                  maxLength={40}
                  autoFocus
                  className="font-[var(--font-newsreader)] text-[16px]"
                />
                <p className="font-[var(--font-newsreader)] text-[14px] italic text-foreground/55">
                  {t("step1Hint")}
                </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-[var(--font-fraunces)] text-[15px] text-foreground">
                    {t("step2Label")}
                  </p>
                  <p className="mt-1 font-[var(--font-newsreader)] text-[14px] italic text-foreground/55">
                    {t("step2Hint")}
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
                      tWorlds={tWorlds}
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
                  {t("step3Label")}
                </Label>
                <Textarea
                  id="hero-problem"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder={t("step3Placeholder")}
                  rows={5}
                  maxLength={500}
                  autoFocus
                  className="font-[var(--font-newsreader)] text-[15.5px] leading-relaxed"
                />
                <p className="font-[var(--font-newsreader)] text-[14px] italic text-foreground/55">
                  {t("step3Hint")}
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
                {t("back")}
              </Button>

              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={goNext}
                  className="btn-ember justify-center"
                >
                  {t("next")}
                  <ArrowRight />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="btn-ember justify-center disabled:opacity-50"
                >
                  {submitting ? t("loading") : t("begin")}
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
  tWorlds,
}: {
  world: World;
  index: number;
  selected: boolean;
  onSelect: () => void;
  tWorlds: Translator;
}) {
  const tone = WORLD_TONES[world.key] ?? "var(--forest)";
  const title = tWorlds(`${world.key}.name`);
  const tagline = tWorlds(`${world.key}.description`);

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

function LockedFolio({ t }: { t: Translator }) {
  return (
    <section className="container mx-auto px-6 py-32 md:py-40">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">{t("lockedEyebrow")}</p>
        <h1 className="display-xl mt-6 text-[clamp(2.8rem,6vw,4.8rem)] leading-[0.95]">
          {t("lockedTitle")}&nbsp;
          <span className="italic-wonk text-[color:var(--ember)]">
            {t("lockedTitleAccent")}
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
          {t("lockedBody")}
        </p>
        <div className="mt-10 flex justify-center">
          <Link href="/dashboard" className="btn-ghost-ink">
            {t("lockedCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
