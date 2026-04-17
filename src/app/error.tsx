"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <section className="container mx-auto px-6 py-32 md:py-40">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">&sect; Errata &middot; An interrupted tale</p>

        <h1 className="display-xl mt-6 text-[clamp(3rem,7vw,5.5rem)] leading-[0.95]">
          The ink&nbsp;
          <span className="italic-wonk text-[color:var(--ember)]">ran dry.</span>
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
          Something unexpected happened while we were turning the page. The
          scribes have been notified and will investigate. You can try again, or
          return to a familiar chapter.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/40">
            error &middot; {error.digest}
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button type="button" onClick={reset} className="btn-ember">
            Try again
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="btn-ghost-ink"
          >
            Return home
          </button>
        </div>
      </div>
    </section>
  );
}
