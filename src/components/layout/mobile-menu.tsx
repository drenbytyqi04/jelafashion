"use client";

import { Heart, Search, User, X } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { Dialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { duration, ease } from "@/lib/motion";
import { categoryNav } from "@/lib/nav";
import { whatsappHref } from "@/lib/site";
import { useUiStore } from "@/stores/ui";
import { useLenisLock } from "@/components/motion/use-scroll-lock";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { LanguageSwitcher } from "./language-switcher";

const bigLinks: { key: "shop" | "newIn" | "madeToMeasure" | "atelier" | "contact"; href: AppPathname }[] = [
  { key: "shop", href: "/shop" },
  { key: "newIn", href: "/new-in" },
  { key: "madeToMeasure", href: "/made-to-measure" },
  { key: "atelier", href: "/atelier" },
  { key: "contact", href: "/contact" },
];

const list: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  shown: { opacity: 1, y: 0, transition: { duration: duration.reveal, ease: ease.couture } },
};

export function MobileMenu() {
  const t = useTranslations();
  const open = useUiStore((s) => s.menuOpen);
  const setOpen = useUiStore((s) => s.setMenuOpen);
  const close = () => setOpen(false);
  useLenisLock(open);

  const wa = whatsappHref();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                data-lenis-prevent
                className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ivory text-ink focus:outline-none nav:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: duration.micro } }}
                transition={{ duration: duration.ui, ease: ease.couture }}
              >
                <Dialog.Title className="sr-only">{t("common.menu")}</Dialog.Title>
                <div className="container-page grid h-(--header-h) shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-hairline">
                  <Dialog.Close
                    className="-ml-3 flex size-11 items-center justify-center"
                    aria-label={t("common.closeMenu")}
                  >
                    <X aria-hidden size={22} strokeWidth={1.25} />
                  </Dialog.Close>
                  <Link href="/" onClick={close} aria-label={t("common.home")} className="flex min-h-11 items-center">
                    <span className="wordmark">Jela Fashion</span>
                  </Link>
                  <span />
                </div>

                <motion.nav
                  aria-label={t("nav.primary")}
                  className="container-page flex flex-1 flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8"
                  variants={list}
                  initial="hidden"
                  animate="shown"
                >
                  <ul className="flex flex-col">
                    {bigLinks.map((l) => (
                      <motion.li key={l.key} variants={item}>
                        <Link
                          href={l.href}
                          onClick={close}
                          className="block py-2 font-serif text-[2.5rem] font-light leading-[1.1]"
                        >
                          {t(`nav.${l.key}`)}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>

                  <motion.div variants={item} className="mt-10">
                    <p className="label mb-4 text-stone">{t("menu.collections")}</p>
                    <ul className="grid grid-cols-3 gap-3">
                      {categoryNav.map((c) => (
                        <li key={c.key}>
                          <Link href={c.href} onClick={close} className="group block">
                            <ImagePlaceholder ratio="3/4" tone={c.tone} />
                            <span className="label mt-3 block">{t(`nav.${c.key}`)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  <motion.ul variants={item} className="mt-10 flex flex-col border-t border-hairline pt-4">
                    {(
                      [
                        { href: "/search", label: t("common.search"), Icon: Search },
                        { href: "/account", label: t("common.account"), Icon: User },
                        { href: "/wishlist", label: t("common.wishlist"), Icon: Heart },
                      ] as const
                    ).map(({ href, label, Icon }) => (
                      <li key={href}>
                        <Link href={href} onClick={close} className="flex min-h-11 items-center gap-3 text-small">
                          <Icon aria-hidden size={20} strokeWidth={1.25} />
                          {label}
                        </Link>
                      </li>
                    ))}
                  </motion.ul>

                  <motion.div
                    variants={item}
                    className="mt-auto flex items-center justify-between gap-4 border-t border-hairline pt-4"
                  >
                    <LanguageSwitcher onNavigate={close} className="-ml-1" />
                    {wa ? (
                      <a href={wa} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-2 text-small">
                        <WhatsAppIcon size={20} />
                        {t("common.whatsapp")}
                      </a>
                    ) : (
                      <Link href="/contact" onClick={close} className="flex min-h-11 items-center gap-2 text-small">
                        <WhatsAppIcon size={20} />
                        {t("common.whatsapp")}
                      </Link>
                    )}
                  </motion.div>
                </motion.nav>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
