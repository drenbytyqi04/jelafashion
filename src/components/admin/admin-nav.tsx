"use client";

import { BadgePercent, ExternalLink, Home, LayoutGrid, Layers, LogOut, Mail, Menu, Package, ShoppingBag, Truck, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/cn";
import { Drawer } from "@/components/ui/drawer";

const ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/admin", label: "Paneli", icon: <LayoutGrid size={18} strokeWidth={1.5} /> },
  { href: "/admin/orders", label: "Porositë", icon: <ShoppingBag size={18} strokeWidth={1.5} /> },
  { href: "/admin/products", label: "Produktet", icon: <Package size={18} strokeWidth={1.5} /> },
  { href: "/admin/collections", label: "Koleksionet", icon: <Layers size={18} strokeWidth={1.5} /> },
  { href: "/admin/homepage", label: "Faqja kryesore", icon: <Home size={18} strokeWidth={1.5} /> },
  { href: "/admin/discounts", label: "Zbritjet", icon: <BadgePercent size={18} strokeWidth={1.5} /> },
  { href: "/admin/shipping", label: "Dërgesat", icon: <Truck size={18} strokeWidth={1.5} /> },
  { href: "/admin/payments", label: "Pagesat", icon: <Wallet size={18} strokeWidth={1.5} /> },
  { href: "/admin/customers", label: "Klientët", icon: <Users size={18} strokeWidth={1.5} /> },
  { href: "/admin/newsletter", label: "Newsletter-i", icon: <Mail size={18} strokeWidth={1.5} /> },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <ul className="flex flex-col gap-0.5">
      {ITEMS.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "relative flex h-10 items-center gap-3 rounded-admin px-3 text-[0.875rem]",
              isActive(item.href) ? "bg-linen font-medium text-ink" : "text-stone hover:bg-linen/60 hover:text-ink",
            )}
          >
            {isActive(item.href) && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 bg-champagne" />}
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Footer({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-hairline pt-4 text-[0.8125rem]">
      <a href="/sq" target="_blank" rel="noopener" className="flex h-9 items-center gap-3 rounded-admin px-3 text-stone hover:text-ink">
        <ExternalLink aria-hidden size={16} strokeWidth={1.5} /> Shiko faqen
      </a>
      <form action={signOut}>
        <input type="hidden" name="next" value="/admin/login" />
        <button type="submit" className="flex h-9 w-full items-center gap-3 rounded-admin px-3 text-stone hover:text-ink">
          <LogOut aria-hidden size={16} strokeWidth={1.5} /> Dil
        </button>
      </form>
      <p className="truncate px-3 pt-2 text-[0.75rem] text-stone" title={email}>
        {email}
      </p>
    </div>
  );
}

export function AdminNav({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-hairline bg-white px-3 py-5 lg:flex">
        <Link href="/admin" className="wordmark mb-8 px-3 text-[1rem]">
          Jela Fashion
        </Link>
        <nav aria-label="Paneli" className="flex-1 overflow-y-auto">
          <NavList />
        </nav>
        <Footer email={email} />
      </aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-hairline bg-white px-4 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Hap menunë" aria-expanded={open} className="-ml-2 flex size-11 items-center justify-center">
          <Menu aria-hidden size={20} strokeWidth={1.5} />
        </button>
        <Link href="/admin" className="wordmark text-[0.9375rem]">
          Jela Fashion
        </Link>
        <span aria-hidden className="size-11" />
      </header>
      <Drawer open={open} onOpenChange={setOpen} side="left" title="Paneli" hideTitle>
        <nav aria-label="Paneli">
          <NavList onNavigate={() => setOpen(false)} />
        </nav>
        <div className="mt-6">
          <Footer email={email} />
        </div>
      </Drawer>
    </>
  );
}
