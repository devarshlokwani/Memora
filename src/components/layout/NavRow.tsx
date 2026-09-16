"use client";

import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { SlidingNav, type NavItem } from "@/components/layout/SlidingNav";
import { PushButton } from "@/components/ui/PushButton";

/* Only the phone layout needs this. On anything wider the waitlist is one of
   the items in the row. A page rather than an anchor either way: the form on the
   landing page only exists on one section, and only once somebody has asked for
   it, so a link into it lands nowhere from anywhere else. */
const WAITLIST = "/waitlist";

/**
 * The bar of nav links, wordmark and call to action.
 *
 * One component because it is rendered twice: at the top of the page, and again
 * at the foot of the story where it arrives to say there is more below. The
 * second has to be the first one exactly. It slides up and takes the first
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
  onSelect?: (id: string) => boolean | void;
  onSelectedRect?: (rect: DOMRect | null) => void;
}) {
  return (
    /* w-full rather than relying on the parent to stretch it. In the bar
         at the foot of the story this is a flex item, and auto side margins on a
         flex item soak up the free space instead of filling it. The row
         collapsed to its own width and the call to action landed on top of the
         last link. */
      <div className="relative mx-auto w-full max-w-6xl px-6 py-4">
      <div className="flex items-center justify-between md:hidden">
        <Link href="/" aria-label="Memora home">
          <Logo />
        </Link>
        {/* The phone layout has no row to click along, so this button stands
            in for the waitlist item and is handled by whoever handles the row.
            In the bar at the foot of the story that means the slide; at the top
            of a page it means nothing, and the link simply goes. */}
        <PushButton href={WAITLIST} size="sm" onNavigate={() => onSelect?.("waitlist")}>
          Waitlist
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

    </div>
  );
}
