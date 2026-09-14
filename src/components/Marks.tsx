/**
 * Drawn marks. In a monochrome scheme these do the work that green and red
 * normally do, so right and wrong stay distinguishable by shape rather than hue
 * — which also survives being printed, dimmed, or read by someone colourblind.
 */

export function CheckMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3.5 13.2c2.6 1.5 4.4 3.4 5.8 6 2.6-6.4 6.3-11 11.4-14.3" />
    </svg>
  );
}

export function CrossMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5.4 5c3.9 4.2 8.4 9.2 13.4 14.2" />
      <path d="M18.6 5.4c-4 4.1-8.6 9.1-13.3 13.9" />
    </svg>
  );
}

/** A scribbled circle, for drawing attention to one thing on a card. */
export function CircleMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M24.5 3.2C12.8 2.6 3 7.5 3 14.9c0 7.6 10.5 13.4 22.4 13.4 11.3 0 20.6-5.3 20.6-12.5C46 8.2 36.6 3 25 3.1" />
    </svg>
  );
}
