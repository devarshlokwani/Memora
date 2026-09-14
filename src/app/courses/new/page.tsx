import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { UploadForm } from "@/components/course/UploadForm";
import { getUser } from "@/server/db/client";

export default async function NewCoursePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader email={user.email} />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-[1.9rem] font-semibold tracking-[-0.03em] text-ink">
          New course
        </h1>
        <p className="mt-1.5 max-w-[56ch] text-[0.95rem] leading-relaxed text-ink-soft">
          Add everything that belongs to one subject. Memora reads them together, so slides and
          the textbook chapter they came from end up in the same topics.
        </p>
        <UploadForm />
      </main>
    </div>
  );
}
