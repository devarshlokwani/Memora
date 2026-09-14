import Link from "next/link";

import { BrainMark } from "@/components/layout/Logo";

type Column = { heading: string; links: { label: string; href: string }[] };

/**
 * Every link here goes somewhere that exists. A footer full of dead ends is
 * worse than a short one.
 */
const COLUMNS: Column[] = [
  {
    heading: "Study",
    links: [
      { label: "Try a card", href: "/?s=try" },
      { label: "How it works", href: "/?s=how" },
      { label: "Formats", href: "/?s=formats" },
    ],
  },
  {
    heading: "Your courses",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Review what's due", href: "/review" },
      { label: "New course", href: "/courses/new" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create an account", href: "/signup" },
      { label: "Set up Memora", href: "/setup" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-paper-deep px-7 py-12 sm:px-12 sm:py-14">
          <div className="grid gap-12 md:grid-cols-[1.2fr_2fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 text-ink">
                <BrainMark className="h-10 w-11 shrink-0" />
                <span className="font-reading text-[2rem] leading-none">Memora</span>
              </Link>
              <p className="mt-5 max-w-[42ch] text-[0.95rem] leading-relaxed text-ink-soft">
                Hand over the PDF and get back a way to study it. Memora reads your course
                material, builds the structure your lecturer never gave you, and turns every topic
                into cards you can actually drill.
              </p>
            </div>

            <nav className="grid gap-10 sm:grid-cols-3">
              {COLUMNS.map((column) => (
                <div key={column.heading}>
                  <h2 className="font-hand text-lg text-ink-faint">{column.heading}</h2>
                  <ul className="mt-3 space-y-2.5">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-[0.95rem] text-ink-soft transition-colors hover:text-ink"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* The wordmark at full size, the way a name is signed at the bottom of
            a page. Decorative, so it is hidden from assistive tech. */}
        <p
          aria-hidden="true"
          className="mt-10 select-none text-center font-reading leading-none text-rule"
          style={{ fontSize: "clamp(3.5rem, 15vw, 11rem)" }}
        >
          Memora
        </p>

        <div className="mt-8 flex flex-col gap-3 border-t border-rule py-6 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Memora</p>
          <p className="font-hand text-lg">Made for people who have exams on Monday.</p>
        </div>
      </div>
    </footer>
  );
}
