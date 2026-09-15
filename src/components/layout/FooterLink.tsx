import Link from "next/link";

import { DrawnUnderline } from "@/components/ui/DrawnUnderline";

/**
 * Three states, in order: at rest it is just words; hovering draws a line under
 * it from the left and brings an arrow in behind the text; pressing sends the
 * arrow a little further, so the click has somewhere to go.
 */
export function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center whitespace-nowrap text-[0.95rem] text-ink-soft transition-colors hover:text-ink"
    >
      <span className="relative">
        {children}
        <DrawnUnderline />
      </span>
      <span
        aria-hidden="true"
        className="ml-1.5 -translate-x-1.5 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-active:translate-x-1.5"
      >
        &rarr;
      </span>
    </Link>
  );
}
