import type { Metadata } from "next";
import { Caveat, Instrument_Sans, Instrument_Serif } from "next/font/google";

import { RouteCurtain } from "@/components/layout/RouteCurtain";
import { SiteFooter } from "@/components/layout/SiteFooter";
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
  title: "Memora",
  description: "Upload your course material. Get a study structure and cards that drill it.",
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
