import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function LoginPage() {
  // The form cannot reach a database that is not configured yet.
  if (!isSupabaseConfigured()) redirect("/setup");

  return (
    <main className="paper-texture flex min-h-dvh items-center justify-center px-6 py-16">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
