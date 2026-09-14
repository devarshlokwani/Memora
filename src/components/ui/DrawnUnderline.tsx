/**
 * One stroke shape for every underline on the site — the headline mark, the
 * footer links, the grading buttons, the nav. Exported so the nav can drive the
 * same path from GSAP rather than redrawing it.
 */
export const UNDERLINE_PATH = "M3 8.2C41 3.4 74 10.6 106 6 138 1.6 168 8.6 197 4";

/**
 * The drawn stroke that wipes in under a label on hover.
 *
 * Put `group` and `relative` on the thing being underlined. It runs on a CSS
 * transition rather than GSAP: these are per-element hover states on a dozen
 * elements, and the browser animates the dash with nothing attached.
 */
export function DrawnUnderline({
  colour = "var(--color-accent)",
  className = "",
}: {
  colour?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 -bottom-1 h-[0.42em] w-full overflow-visible ${className}`}
    >
      <path
        d={UNDERLINE_PATH}
        pathLength={100}
        fill="none"
        stroke={colour}
        strokeWidth="2.6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="[stroke-dasharray:100] [stroke-dashoffset:100] transition-[stroke-dashoffset] duration-300 ease-out group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]"
      />
    </svg>
  );
}
