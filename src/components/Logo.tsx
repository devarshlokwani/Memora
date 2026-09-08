/** A card box seen edge-on: three stacked cards with the front one marked. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" className="shrink-0">
        <rect x="3" y="5" width="20" height="14" rx="2.5" className="fill-rule" />
        <rect x="2" y="7.5" width="22" height="14" rx="2.5" className="fill-ink-faint" />
        <rect
          x="1"
          y="10"
          width="24"
          height="14"
          rx="2.5"
          className="fill-card stroke-ink"
          strokeWidth="1.5"
        />
        <rect x="4.5" y="14.5" width="12" height="2.5" className="fill-highlight" />
      </svg>
      <span className="text-[1.35rem] font-semibold tracking-[-0.03em] text-ink">Memora</span>
    </span>
  );
}
