import Link from "next/link";

import { BrainScene } from "@/components/layout/BrainScene";
import { FooterLink } from "@/components/layout/FooterLink";
import { FooterWordmark } from "@/components/layout/FooterWordmark";
import { MeetTheCreator } from "@/components/layout/MeetTheCreator";
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
    heading: "Coming",
    links: [
      { label: "Join the waitlist", href: "/waitlist" },
      { label: "The story", href: "/?s=hero" },
    ],
  },
  {
    heading: "Small print",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <MeetTheCreator />

        {/* overflow-hidden is what makes the wordmark surface from inside the
            block rather than slide past behind it. */}
        <div className="overflow-hidden rounded-[2rem] bg-footer px-7 pt-12 sm:px-12 sm:pt-14">
          <div className="grid gap-12 md:grid-cols-[1fr_1.9fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 text-ink">
                <BrainMark className="h-12 w-14 shrink-0" />
                <span className="font-reading text-[2rem] leading-none">Memora</span>
              </Link>
              <p className="mt-5 max-w-[42ch] text-[0.95rem] leading-relaxed text-ink-soft">
                Hand over the PDF and get back a way to study it. Memora reads your course
                material, builds the structure your lecturer never gave you, and turns every topic
                into cards you can actually drill.
              </p>
            </div>

            <nav className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 sm:gap-x-10">
              {COLUMNS.map((column) => (
                <div key={column.heading}>
                  {/* ink-soft rather than ink-faint: on the footer's deeper tone the faint
                      grey drops to 3.9:1. The handwritten face is what separates a
                      heading from its links here, not the weight of the ink. */}
                  <h2 className="whitespace-nowrap font-hand text-lg text-ink-soft">{column.heading}</h2>
                  <ul className="mt-3 space-y-2.5">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <FooterLink href={link.href}>{link.label}</FooterLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* The brain stands in front and the name rises from behind it. The
              wordmark is inside its own clip, so the brain has to be a sibling
              of that clip rather than a child. Anything in there is cut off at
              the line box along with the letters. Resting on the panel's bottom
              edge rather than centred on the word, because the panel clips there
              too and a 3D object sliced off mid-turn reads as broken, where
              letters sliced off read as typography. */}
          <div className="relative mt-14">
            <FooterWordmark />
            <div className="pointer-events-none absolute -bottom-10 left-1/2 z-10 w-[clamp(10rem,23vw,18rem)] -translate-x-1/2">
              <BrainScene />
            </div>
          </div>
        </div>

      </div>

      {/* Full width and the nav's colour, so the page closes on what it opened
          with, and so over-scrolling past the bottom meets white rather than a
          seam between the strip and the canvas behind it. */}
      <div className="mt-12 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-7 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Memora</p>
          <p className="font-hand text-lg">Made for people who have exams on Monday.</p>
        </div>
      </div>
    </footer>
  );
}
