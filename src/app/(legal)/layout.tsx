"use client";

import { usePathname } from "next/navigation";

import { PageShell } from "@/components/layout/PageShell";

/**
 * The shell the small print shares.
 *
 * A layout rather than a piece of each page, because Next keeps a layout across
 * a move between the routes under it. That is the whole reason it exists: the
 * second row used to be part of the page, so going from the terms to the privacy
 * notice tore it down and built it again, and the row could be seen leaving and
 * arriving for a move that never left it. Here it simply stays, and the line
 * under the one you are reading slides across to the other.
 *
 * Which one you are on comes from the path, which changes without this
 * unmounting, so the row hears about it the way any other prop changes.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return <PageShell sub={path === "/privacy" ? "privacy" : "terms"}>{children}</PageShell>;
}
