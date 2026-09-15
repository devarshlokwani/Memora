"use client";

import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { SlidingNav, type NavItem } from "@/components/layout/SlidingNav";
import { PushButton } from "@/components/ui/PushButton";

/**
 * The bar of nav links, wordmark and call to action.
 *
 * One component because it is rendered twice: at the top of the page, and again
 * at the foot of the story where it arrives to say there is more below. The
 * second has to be the first one exactly — it slides up and takes the first
 * one's place, and any difference between them shows as a jump at the handover.
 */
export function NavRow({
  items,
  activeId,
  onSelect,
  onSelectedRect,
}: {
  items: NavItem[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  onSelectedRect?: (rect: DOMRect | null) => void;
}) {
  return (
    <div className="relative mx-auto max-w-6xl px-6 py-4">
      <div className="flex items-center justify-between md:hidden">
        <Link href="/" aria-label="Memora home">
          <Logo />
        </Link>
        <PushButton href="/signup" size="sm">
          Get started
        </PushButton>
      </div>

      <div className="hidden items-center justify-center md:flex">
        <SlidingNav
          items={items}
          activeId={activeId}
          onSelect={onSelect}
          onSelectedRect={onSelectedRect}
        />
      </div>

      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 items-center gap-4 md:flex">
        <PushButton href="/signup" size="sm">
          Get started
        </PushButton>
      </div>
    </div>
  );
}
