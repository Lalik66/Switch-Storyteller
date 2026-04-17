/** Server-safe SVG decorations for the marketing hero (no "use client"). */

export function HeroConstellation({
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
      className={`h-28 w-28 text-[color:var(--ember)]/55 ${className ?? ""}`}
      aria-hidden="true"
    >
      <g>
        {points.map(([x, y], i) => (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={i === 2 ? 1.6 : 1}
              fill="currentColor"
              className="twinkle"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          </g>
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

export function HeroInkSwirl() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className="absolute right-[-40px] top-[30%] hidden w-[260px] text-[color:var(--gold)] opacity-60 md:block drift"
    >
      <path
        d="M20 100 C 20 40, 80 20, 120 60 S 180 160, 100 180 S 20 140, 60 100 S 140 90, 140 130"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}
