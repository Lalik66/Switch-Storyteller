"use client";

import Link from "next/link";
import { UserProfile } from "@/components/auth/user-profile";
import { useDiagnostics } from "@/hooks/use-diagnostics";
import { useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const { isAiReady, loading: diagnosticsLoading } = useDiagnostics();

  if (isPending) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="eyebrow">Loading the workshop&hellip;</p>
      </div>
    );
  }

  if (!session) {
    return (
      <section className="container mx-auto px-6 py-32 md:py-40">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow">&sect; Threshold &middot; A locked door</p>
          <h1 className="display-xl mt-6 text-[clamp(2.8rem,6vw,4.8rem)] leading-[0.95]">
            This page is&nbsp;
            <span className="italic-wonk text-[color:var(--ember)]">
              by invitation.
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
            Sign in to step inside. Your tales, your characters, and your
            child&rsquo;s progress all wait behind this door.
          </p>

          <div className="mt-10 flex justify-center">
            <UserProfile />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <header className="mb-16 max-w-2xl">
        <p className="eyebrow">&sect; The workshop &middot; Today</p>
        <h1 className="display-lg mt-4 text-5xl md:text-6xl">
          Welcome back,
          <br />
          <span className="italic-wonk text-[color:var(--ember)]">
            {session.user.name?.split(" ")[0] ?? "scribe"}.
          </span>
        </h1>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <article className="card-stamp p-7">
          <div className="flex items-baseline justify-between">
            <span className="display-lg text-[color:var(--ember)] text-[3.5rem] leading-none">
              I
            </span>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground/35"
              aria-hidden="true"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <div className="mt-4 h-px w-full bg-gradient-to-r from-[color:var(--ember)]/60 via-border to-transparent" />
          <h2 className="mt-6 text-2xl">Storyteller</h2>
          <p className="mt-3 font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
            Start a conversation with the AI storyteller. Sketch characters,
            test scene ideas, or simply talk through your next chapter.
          </p>
          <div className="mt-6">
            {diagnosticsLoading || !isAiReady ? (
              <span className="btn-ghost-ink opacity-50 cursor-not-allowed">
                Awaiting keys&hellip;
              </span>
            ) : (
              <Link href="/chat" className="btn-ember">
                Open the chat
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
            )}
          </div>
        </article>

        <article className="card-stamp p-7">
          <div className="flex items-baseline justify-between">
            <span className="display-lg text-[color:var(--ember)] text-[3.5rem] leading-none">
              II
            </span>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground/35"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="mt-4 h-px w-full bg-gradient-to-r from-[color:var(--ember)]/60 via-border to-transparent" />
          <h2 className="mt-6 text-2xl">Your scribe&rsquo;s mark</h2>
          <dl className="mt-5 space-y-3 font-[var(--font-newsreader)] text-[15px] text-foreground/80">
            <div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2">
              <dt className="eyebrow">Name</dt>
              <dd>{session.user.name}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2">
              <dt className="eyebrow">Email</dt>
              <dd className="truncate">{session.user.email}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <Link href="/profile" className="btn-ghost-ink">
              Manage profile
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
