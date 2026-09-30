import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/viewer";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  // Pages and actions check again: a layout doesn't re-run on every navigation.
  const viewer = await requireAdmin();
  return (
    <div className="min-h-dvh">
      <AdminNav email={viewer.email} />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
