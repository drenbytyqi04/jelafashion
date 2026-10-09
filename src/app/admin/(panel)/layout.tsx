import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/viewer";
import { AdminNav } from "@/components/admin/admin-nav";
import { LiveRefresh } from "@/components/admin/live-refresh";
import { orderStore } from "@/lib/commerce/order-store";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  // Pages and actions check again: a layout doesn't re-run on every navigation.
  const viewer = await requireAdmin();
  // New orders: the menu badge, the tab title and the auto-refresh while the panel is open.
  const unseen = await orderStore()
    ?.unseen(1)
    .then((r) => r.total)
    .catch(() => 0);
  return (
    <div className="min-h-dvh">
      <AdminNav email={viewer.email} unseenOrders={unseen ?? 0} />
      <LiveRefresh unseen={unseen ?? 0} />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
