/** Progress as a highlighter pass across a ruled line. */
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
  return (
    <div
      className={`h-1.5 w-full rounded-sm bg-rule-soft ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div className="swipe h-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
