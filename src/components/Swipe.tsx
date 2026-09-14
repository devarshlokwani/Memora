/**
 * Progress drawn as a pen stroke along a wobbly line: the faint line is what is
 * left, the heavy ink is what is done. `pathLength="100"` lets the dash array be
 * read straight off the percentage.
 */
export function Swipe({
  value,
  total,
  className = "",
}: {
  value: number;
  total: number;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const line = "M2 6 C40 3 70 9 104 5 C138 1 166 8 198 4";

  return (
    <svg
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className={`h-3 w-full ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <path
        d={line}
        fill="none"
        stroke="var(--color-rule)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {pct > 0 && (
        <path
          d={line}
          pathLength="100"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${pct} 100`}
        />
      )}
    </svg>
  );
}
