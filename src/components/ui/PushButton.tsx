import Link from "next/link";

/**
 * A button with a card sitting under it. Hovering lifts it off the page and the
 * shadow opens up; pressing pushes it back down until the two almost meet, which
 * is what makes a click feel like it landed.
 *
 * Done in CSS rather than GSAP on purpose: these are per-element hover states on
 * a dozen buttons, and the browser can run them on the compositor without any
 * JavaScript attached.
 */
export function PushButton({
  href,
  children,
  variant = "solid",
  size = "md",
  external = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  size?: "sm" | "md";
  /** Opens in its own tab, for anywhere that is not this site. */
  external?: boolean;
  className?: string;
}) {
  const pad = size === "sm" ? "px-5 py-2 text-[0.9rem]" : "px-8 py-3.5 text-[1rem]";

  const face =
    variant === "solid"
      ? "bg-ink text-paper border border-ink"
      : "bg-paper text-ink border border-ink";

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`group relative inline-block select-none ${className}`}
    >
      {/* The layer underneath. It never moves up, only further down and back. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-y-[3px] rounded-full bg-ink/30 transition-transform duration-200 ease-out group-hover:translate-y-[6px] group-active:translate-y-[1px]"
      />
      <span
        className={`relative block rounded-full font-medium transition-transform duration-200 ease-out group-hover:-translate-y-[2px] group-active:translate-y-[2px] ${face} ${pad}`}
      >
        {children}
      </span>
    </Link>
  );
}
