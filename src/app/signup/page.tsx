import { Suspense } from "react";

import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="paper-grid flex min-h-dvh items-center justify-center px-6 py-16">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
