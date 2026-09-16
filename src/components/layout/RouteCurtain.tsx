"use client";

import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { NavRow } from "@/components/layout/NavRow";
import { NAV_ITEMS } from "@/components/layout/navItems";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The transition slide, for moves that change the route.
 *
 * The landing page already had one of these for swapping sections: the bar at
 * the foot of the story grows up the window, the page changes behind it, and it
 * shrinks away to the top. Going to the waitlist skipped all of it and simply
 * cut, because that is a different page and the bar belongs to the one being
 * left. The waitlist is an item in the nav like any other and had no business
 * behaving differently from the four beside it.
 *
 * So this one lives in the root layout instead of on a page. A layout survives
 * a route change where a page does not, which is the whole trick: the panel
 * stays up across the navigation, and the new page mounts, lays itself out and
 * plays whatever it plays on arrival with the curtain over the top of it.
 *
 * It carries the same nav row, so what covers the screen is the nav, not a
 * blank sheet, and the row is still there when it settles onto the real header
 * underneath.
 */

type Cross = (href: string, activeId?: string) => void;

const CrossContext = createContext<Cross | null>(null);

/**
 * The sweep, for anything that navigates. Null outside the layout that provides
 * it, so a caller can fall back to letting the link navigate on its own.
 */
export function useRouteCurtain() {
  return useContext(CrossContext);
}

/** Longest to wait for the new route before carrying on regardless. */
const SETTLE = 1400;

export function RouteCurtain({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  /** Resolves when the route this sweep asked for has actually arrived. */
  const arrived = useRef<(() => void) | null>(null);
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    arrived.current?.();
    arrived.current = null;
  }, [pathname]);

  const cross = useCallback<Cross>(
    (href, activeId) => {
      // Already crossing. The click was on the row inside the curtain or on
      // something behind it, and starting a second one would fight the first.
      if (busy.current) return;

      const panel = panelRef.current;
      if (!panel || prefersReducedMotion()) {
        router.push(href);
        return;
      }
      busy.current = true;
      setTarget(activeId ?? null);

      /* If the story's own bar is sitting at the foot of the window, the curtain
         starts out exactly the size of it and the bar goes. Otherwise the two
         would both be visible for the first frames of the growth, which is the
         same one-frame double nav the story's sweep was built to avoid. */
      const bar = document.querySelector<HTMLElement>("[data-nav-bar]");
      const barBox = bar?.getBoundingClientRect();
      const from = barBox && barBox.top < window.innerHeight - 1 ? barBox.height : 0;
      if (from > 0 && bar) bar.style.opacity = "0";

      const run = async () => {
        gsap.set(panel, { height: from, top: "auto", bottom: 0, autoAlpha: 1 });
        await gsap.to(panel, { height: window.innerHeight, duration: 0.5, ease: "power3.inOut" });

        router.push(href);
        // Re-hung from the top, so shrinking pulls it up rather than down. It
        // fills the window either way, so nothing moves at the swap.
        gsap.set(panel, { top: 0, bottom: "auto" });

        await new Promise<void>((done) => {
          const timer = window.setTimeout(done, SETTLE);
          arrived.current = () => {
            window.clearTimeout(timer);
            done();
          };
        });
        // A breath at full cover for the new page to put itself together.
        await new Promise((done) => window.setTimeout(done, 220));

        /* Down to the height of the header that has arrived underneath, not to
           nothing. The row inside this is that same row, so the last frame of
           the shrink and the first frame of the page agree exactly and there is
           no handover to see. */
        const header = document.querySelector("header")?.getBoundingClientRect().height ?? 68;
        await gsap.to(panel, { height: header, duration: 0.55, ease: "power3.inOut" });

        gsap.set(panel, { autoAlpha: 0, height: 0 });
        busy.current = false;
      };

      void run();
    },
    [router],
  );

  return (
    <CrossContext.Provider value={cross}>
      {children}
      <div
        ref={panelRef}
        style={{ height: 0, visibility: "hidden" }}
        /* Above the header and above the story's bar, since it has to cover
           both. Laid out from the centre so the row finds the middle of the
           window while it is open and drifts back into a bar as it closes. */
        className="fixed inset-x-0 bottom-0 z-[80] flex flex-col justify-center overflow-hidden bg-paper"
        /* Never a control, in any state. The row in here is a picture of the nav
           held up while the page changes behind it, and the real one is a fifth
           of a second away underneath; a second set of live links covering the
           screen is only somewhere to click by mistake. */
        aria-hidden="true"
        inert
      >
        <div className="pointer-events-none">
          <NavRow items={NAV_ITEMS} activeId={target} />
        </div>
      </div>
    </CrossContext.Provider>
  );
}
