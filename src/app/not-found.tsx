import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container mx-auto px-6 py-32 md:py-40">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">
          &sect; Errata &middot; A missing page
        </p>
        <h1 className="display-xl mt-6 text-[clamp(4.5rem,14vw,9rem)] leading-none">
          <span className="italic-wonk text-[color:var(--ember)]">404</span>
        </h1>
        <h2 className="display-lg mt-4 text-3xl md:text-4xl">
          This folio was&nbsp;
          <span className="italic-wonk text-foreground/60">never bound.</span>
        </h2>

        <div className="rule-ornament my-8 mx-auto max-w-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"
              fill="currentColor"
            />
          </svg>
        </div>

        <p className="mx-auto max-w-md font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
          The page you were looking for has wandered off into another tale, or
          perhaps it was never written at all. Let&rsquo;s get you back to a
          familiar chapter.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="btn-ember">
            Return home
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
          <Link href="/dashboard" className="btn-ghost-ink">
            Open dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
