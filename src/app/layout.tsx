import type { Metadata } from "next";
import { Caveat, Instrument_Sans, Instrument_Serif } from "next/font/google";

import { RouteCurtain } from "@/components/layout/RouteCurtain";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SITE_DESCRIPTION, SITE_URL, WAITLIST_OPENED } from "@/lib/site";
import { PaperMarks } from "@/components/ui/PaperMarks";

import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Marginalia only: the odd label or aside, never a paragraph.
const hand = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  /* Absolute URLs are built from this. Without it every social preview points
     at a relative path, which the machine unfurling the link cannot resolve. */
  metadataBase: new URL(SITE_URL),

  /* The template gives every other page a suffix for free: a page setting
     `title: "Terms"` renders as "Terms | Memora", and only the landing page
     uses the bare default. */
  title: {
    default: "Memora, a study deck built from your own notes",
    template: "%s | Memora",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Memora",

  /* LinkedIn, and a few other unfurlers behind it, look for an author and a
     date on every page and report the card as incomplete when neither is
     there. `authors` renders <meta name="author"> plus <link rel="author">,
     which is the pair its inspector reads. */
  authors: [{ name: "Devarsh Lokwani", url: "https://devarshlokwani.com" }],
  creator: "Devarsh Lokwani",
  publisher: "Memora",

  openGraph: {
    type: "website",
    siteName: "Memora",
    title: "Memora, a study deck built from your own notes",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memora, a study deck built from your own notes",
    description: SITE_DESCRIPTION,
  },

  /* Nothing here is worth indexing beyond the landing page and the small
     print, and robots.ts says which. This is the per-page default. */
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${hand.variable}`}>
      {/* The footer is part of the page shell, so every route gets the same one
          and no page has to remember to include it. */}
      {/* isolate, or the marks behind the page paint under the body's own
          background instead of on top of it and never show at all. */}
      <body className="relative isolate flex min-h-dvh flex-col">
        {/* Behind everything, and the height of the whole document rather than
            the viewport, so the marks scroll with the page they are drawn on. */}
        {/*
          The publication date, which LinkedIn reports as missing without it.

          Written as raw tags rather than through `metadata.other`, because
          `other` can only emit `name="..."` and every OpenGraph reader,
          LinkedIn included, matches on `property="..."`. React 19 hoists a
          bare meta element out of the tree and into the head, so these land in
          the same place the generated ones do.

          The og:type is `website`, which is honest: this is a landing page and
          not a post, and Next only exposes a typed `publishedTime` under the
          `article` type. LinkedIn reads `article:published_time` whatever the
          type says, so it is set by hand. It stays pinned to the day the
          waitlist opened rather than following the build, because it is a
          publication date.
        */}
        <meta property="article:published_time" content={WAITLIST_OPENED} />
        <meta property="article:author" content="Devarsh Lokwani" />

        <PaperMarks />
        {/* Wrapped here rather than on any page: the slide has to stay up
            across a navigation, and a layout is what survives one. */}
        <RouteCurtain>
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </RouteCurtain>
      </body>
    </html>
  );
}
