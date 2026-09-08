import type { Metadata } from "next";
import { Familjen_Grotesk, Newsreader } from "next/font/google";

import "./globals.css";

const grotesk = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

const reading = Newsreader({
  subsets: ["latin"],
  variable: "--font-reading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Memora",
  description: "Upload your course material. Get a study structure and cards that drill it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${reading.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
