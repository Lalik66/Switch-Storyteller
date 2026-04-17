import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Shared layout for all (auth) pages.
 * Follows the design system — see docs/design-system/patterns.md §"Section header"
 * and docs/design-system/components.md §".card-stamp".
 */
export function AuthShell({
  eyebrow,
  titleLead,
  titleAccent,
  description,
  children,
  footer,
}: Props) {
  return (
    <section className="relative flex min-h-[calc(100vh-10rem)] items-center justify-center px-6 py-20">
      {/* decorative constellations */}
      <Constellation className="absolute left-[8%] top-[14%] hidden md:block" />
      <Constellation
        className="absolute right-[10%] bottom-[12%] hidden md:block"
        variant="b"
      />

      <div className="relative w-full max-w-md">
        <header className="mb-8 text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display-lg mt-4 text-4xl md:text-5xl">
            {titleLead}
            <br />
            <span className="italic-wonk text-[color:var(--ember)]">
              {titleAccent}
            </span>
          </h1>
          <p className="mt-5 font-[var(--font-newsreader)] text-[15px] leading-relaxed text-foreground/70">
            {description}
          </p>
        </header>

        <article className="card-stamp p-8">
          <div className="rule-ornament mb-6">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="flex flex-col items-stretch gap-4">{children}</div>
        </article>

        {footer && (
          <p className="mt-6 text-center font-[var(--font-newsreader)] text-[14px] text-foreground/65">
            {footer}
          </p>
        )}

        <p className="mt-10 text-center">
          <Link
            href="/"
            className="eyebrow inline-flex items-center gap-2 text-foreground/55 transition-colors hover:text-[color:var(--ember)]"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            Back to the Forge
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ── Decorative constellation (same as landing page hero) ─────────── */

function Constellation({
  className,
  variant = "a",
}: {
  className?: string;
  variant?: "a" | "b";
}) {
  const points =
    variant === "a"
      ? [
          [10, 20],
          [40, 8],
          [70, 30],
          [55, 60],
          [20, 55],
          [85, 70],
        ]
      : [
          [12, 14],
          [34, 40],
          [60, 16],
          [78, 50],
          [20, 72],
          [52, 82],
        ];
  return (
    <svg
      viewBox="0 0 100 100"
      className={`h-24 w-24 text-[color:var(--ember)]/45 ${className ?? ""}`}
      aria-hidden="true"
    >
      <g>
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === 2 ? 1.6 : 1}
            fill="currentColor"
            className="twinkle"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
        ))}
        <path
          d={`M${points.map((p) => p.join(",")).join(" L ")}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.4"
          strokeDasharray="1 2"
        />
      </g>
    </svg>
  );
}
