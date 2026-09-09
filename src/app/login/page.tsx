import { Suspense } from "react";

import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="paper-grid flex min-h-dvh items-center justify-center px-6 py-16">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
