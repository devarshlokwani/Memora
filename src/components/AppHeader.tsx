import Link from "next/link";

import { Logo } from "@/components/Logo";

export function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="border-b border-rule bg-card/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="rounded">
          <Logo />
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {email && <span className="hidden text-ink-faint sm:inline">{email}</span>}
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-ink-soft hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
