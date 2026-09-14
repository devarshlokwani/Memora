"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/Logo";
import { SlidingNav, type NavItem } from "@/components/SlidingNav";

const ITEMS: NavItem[] = [
  { id: "courses", label: "Courses", href: "/dashboard" },
  { id: "review", label: "Review", href: "/review" },
  { id: "new", label: "New course", href: "/courses/new" },
];

/** Which nav item the current URL belongs to, so the mark rests in the right place. */
function activeFrom(pathname: string) {
  if (pathname.startsWith("/courses/new")) return "new";
  if (pathname.startsWith("/review")) return "review";
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/courses")) return "courses";
  if (pathname.startsWith("/study")) return "courses";
  return null;
}

export function AppHeader({ email }: { email?: string | null }) {
  const pathname = usePathname() ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-3.5">
        <Link href="/dashboard" aria-label="Memora home">
          <Logo />
        </Link>

        <div className="hidden md:block">
          <SlidingNav items={ITEMS} activeId={activeFrom(pathname)} />
        </div>

        <div className="flex items-center gap-4 text-sm">
          {email && <span className="hidden text-ink-faint lg:inline">{email}</span>}
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-ink-soft hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Phone: the same destinations, without the travelling mark. */}
      <nav className="flex gap-5 border-t border-rule px-6 py-2 text-sm md:hidden">
        {ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={
              activeFrom(pathname) === item.id
                ? "font-medium text-ink"
                : "text-ink-soft hover:text-ink"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
