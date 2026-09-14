/**
 * A brain, drawn rather than constructed: open strokes, round caps, and folds
 * that do not repeat. Uses currentColor so it inks itself on paper and chalks
 * itself on the board without a second asset.
 */
export function BrainMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 42"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Outline: bumpy skull-side, cerebellum tucked under at the back. */}
      <path d="M23.5 7.2c-2.6-3.4-8.4-3-10 .9-4.6-.6-7.8 3.6-6.2 7.3-3.6 2.1-3.3 7.4.4 9-1.4 3.8 1.6 7.6 5.6 7.2.6 3.4 4.8 5.2 7.7 3.2" />
      <path d="M23.5 7.2c2.6-3.4 8.4-3 10 .9 4.6-.6 7.8 3.6 6.2 7.3 3.6 2.1 3.3 7.4-.4 9 1.4 3.8-1.6 7.6-5.6 7.2-.6 3.4-4.8 5.2-7.7 3.2" />
      {/* The fissure down the middle, and the stem. */}
      <path d="M23.5 7.2v27.6" />
      <path d="M23.5 34.8c-.4 2.4.6 4.2 2.6 5.2" />
      {/* Folds. Deliberately uneven on each side. */}
      <path d="M13.8 12.1c3.4 1.1 3.9 3.6 1.6 5.2 2.8 1 3 3.6.4 4.9" />
      <path d="M11.6 26.4c3-1.3 5.6-.2 6.2 2.3" />
      <path d="M17.9 9.9c1.2 2.1.6 3.8-1.2 4.6" />
      <path d="M33.4 12.6c-3.3 1.3-3.6 3.8-1.2 5.2-2.7 1.2-2.7 3.8 0 4.9" />
      <path d="M35.9 26.7c-3.1-1.1-5.6.1-6 2.6" />
      <path d="M29.3 10.2c-1.1 2.2-.4 3.8 1.4 4.5" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-ink ${className}`}>
      <BrainMark className="h-7 w-8 shrink-0" />
      <span className="font-reading text-[1.6rem] leading-none tracking-[-0.01em]">Memora</span>
    </span>
  );
}
