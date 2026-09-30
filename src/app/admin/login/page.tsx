import type { Metadata } from "next";
import Link from "next/link";
import { authMode, getViewer } from "@/lib/auth/viewer";
import { redirect } from "next/navigation";
import { SignInPanel } from "@/components/account/sign-in-panel";

export const metadata: Metadata = { title: "Hyrja" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ denied?: string; error?: string }> }) {
  const viewer = await getViewer();
  if (viewer?.role === "admin") redirect("/admin");
  const { denied, error } = await searchParams;
  const google = authMode() === "supabase" && process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <Link href="/sq" className="wordmark mb-12">
        Jela Fashion
      </Link>
      <div className="w-full max-w-md rounded-admin border border-hairline bg-white p-8">
        {denied && viewer && (
          <p role="alert" className="mb-6 rounded-admin border border-error/60 px-4 py-3 text-[0.8125rem] text-error">
            Llogaria {viewer.email} nuk ka qasje në panel. Hyr me email-in e ateljes.
          </p>
        )}
        <SignInPanel
          next="/admin"
          google={google}
          linkError={error === "link"}
          title="Paneli i ateljes"
          intro="Shkruaj email-in e ateljes dhe të dërgojmë një lidhje për të hyrë."
          note={null}
        />
      </div>
    </main>
  );
}
