"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/layout/Logo";
import { createClient } from "@/lib/supabase/browser";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    if (isSignup) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setBusy(false);
        return;
      }
      // No session means the project requires email confirmation first.
      if (!data.session) {
        setCheckEmail(true);
        setBusy(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setBusy(false);
        return;
      }
    }

    router.push(next);
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="w-full max-w-sm">
        <Logo className="mb-8" />
        <h1 className="font-reading text-3xl leading-tight text-ink">Confirm your email</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
          We sent a link to <span className="font-medium text-ink">{email}</span>. Open it and
          you&rsquo;ll land back here, signed in.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Logo className="mb-8" />
      <h1 className="font-reading text-3xl leading-tight text-ink">
        {isSignup ? "Start your first course" : "Welcome back"}
      </h1>
      <p className="mt-2 text-[0.95rem] text-ink-soft">
        {isSignup
          ? "Upload your material and Memora builds the structure."
          : "Pick up where your cards left off."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {isSignup && (
          <Field
            label="Your name"
            value={name}
            onChange={setName}
            type="text"
            autoComplete="name"
          />
        )}
        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          hint={isSignup ? "At least 6 characters." : undefined}
        />

        {error && (
          <p className="rounded-full bg-ink-soft px-3 py-2 text-sm text-ink-soft">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-ink px-4 py-3 text-[0.95rem] font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "One moment" : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-ink underline decoration-ink decoration-1 underline-offset-4"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  autoComplete,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-rule bg-card px-3 py-2.5 text-[0.95rem] text-ink outline-none transition-colors focus:border-ink"
      />
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}
