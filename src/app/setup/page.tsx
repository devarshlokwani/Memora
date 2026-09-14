import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/layout/Logo";
import { isAnthropicConfigured, isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Set up Memora" };

export default function SetupPage() {
  const supabaseReady = isSupabaseConfigured();
  const anthropicReady = isAnthropicConfigured();

  // Nothing left to explain once the keys are in place.
  if (supabaseReady && anthropicReady) redirect("/dashboard");

  return (
    <div className="paper-texture flex flex-1 flex-col">
      <header className="mx-auto max-w-3xl px-6 py-6">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-ink">
          Two keys and Memora is running
        </h1>
        <p className="mt-3 max-w-[62ch] text-[1rem] leading-relaxed text-ink-soft">
          The interface works already &mdash; you can look around the landing page without any of
          this. Uploading a document, signing in and generating cards need a database and a model
          to talk to.
        </p>

        <ol className="mt-10 space-y-8">
          <Step
            n={1}
            done={supabaseReady}
            title="Create a Supabase project"
            doneNote="Supabase keys found."
          >
            <p>
              Make a free project at{" "}
              <Extern href="https://supabase.com/dashboard">supabase.com</Extern>. Open the SQL
              editor, paste in the whole of{" "}
              <Code>supabase/migrations/0001_init.sql</Code> from this repo, and run it. That
              creates every table, the row-level security policies, the file bucket, and the two
              views the dashboard reads.
            </p>
            <p className="mt-2">
              Then copy the <span className="font-medium text-ink">Project URL</span> and the{" "}
              <span className="font-medium text-ink">anon public</span> key from Project Settings
              &rarr; API.
            </p>
          </Step>

          <Step
            n={2}
            done={anthropicReady}
            title="Get an Anthropic API key"
            doneNote="Anthropic key found."
          >
            <p>
              Create one at{" "}
              <Extern href="https://console.anthropic.com/settings/keys">
                console.anthropic.com
              </Extern>
              . Memora uses it twice per course: once to work out the structure, then once per
              topic to write the cards.
            </p>
          </Step>

          <Step n={3} done={false} title="Put them in .env.local" hideStatus>
            <p>
              Copy <Code>.env.example</Code> to <Code>.env.local</Code> in the project root and
              fill in the three values:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-2xl border border-rule bg-card p-4 text-[0.85rem] leading-relaxed text-ink">
              {`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...`}
            </pre>
            <p className="mt-3">
              Restart the dev server afterwards &mdash; environment variables are only read at
              startup.
            </p>
          </Step>
        </ol>

        <div className="mt-12 sketch sketch-a p-5">
          <h2 className="font-reading text-lg text-ink">One more thing, for local testing</h2>
          <p className="mt-1.5 max-w-[62ch] text-[0.95rem] leading-relaxed text-ink-soft">
            New Supabase projects ask every account to confirm its email address. Either click the
            link in the confirmation email, or turn confirmation off under Authentication &rarr;
            Sign In / Providers &rarr; Email while you are testing.
          </p>
        </div>

        <Link
          href="/"
          className="mt-10 inline-block rounded-full border border-ink px-5 py-2.5 text-[0.95rem] font-medium text-ink hover:bg-card"
        >
          Look at the landing page
        </Link>
      </main>
    </div>
  );
}

function Step({
  n,
  title,
  done,
  doneNote,
  hideStatus,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  doneNote?: string;
  hideStatus?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="border-t-2 border-ink pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[1.1rem] font-semibold text-ink">
          <span className="mr-3 font-reading text-xl font-normal text-ink-faint">{n}</span>
          {title}
        </h2>
        {!hideStatus && (
          <span className={`text-sm ${done ? "text-ink" : "text-ink-faint"}`}>
            {done ? (doneNote ?? "Done") : "Not set yet"}
          </span>
        )}
      </div>
      <div className="mt-2.5 max-w-[64ch] text-[0.95rem] leading-relaxed text-ink-soft">
        {children}
      </div>
    </li>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-rule-soft px-1.5 py-0.5 text-[0.85em] text-ink">{children}</code>
  );
}

function Extern({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-ink underline decoration-ink decoration-1 underline-offset-4"
    >
      {children}
    </a>
  );
}
