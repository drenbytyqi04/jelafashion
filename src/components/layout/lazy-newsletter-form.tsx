"use client";

import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { source?: "footer" | "popup"; onSubscribed?: () => void };

/** Same markup as the real form, without the form library: nothing moves when it swaps. */
function Placeholder({ onWake }: { onWake: () => void }) {
  const t = useTranslations("newsletter");
  return (
    <form noValidate className="w-full" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <Input
          label={t("emailLabel")}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t("placeholder")}
          className="md:flex-1"
          onFocus={onWake}
        />
        <Button type="submit" className="md:mt-[calc(0.875rem*1.55+0.5rem)]" onPointerDown={onWake}>
          {t("submit")}
        </Button>
      </div>
      <p className="mt-3 text-small text-stone">
        <Link href="/privacy" className="link-underline">
          {t("consent")}
        </Link>
      </p>
    </form>
  );
}

const loadForm = () => import("./newsletter-form").then((m) => m.NewsletterForm);

/**
 * The newsletter form sits at the foot of every page, so its validation code loads only when
 * the footer comes near the screen (or the field is touched), not with the first paint.
 */
export function LazyNewsletterForm(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [Form, setForm] = useState<ComponentType<Props> | null>(null);
  const carry = useRef<{ value: string; focus: boolean } | null>(null);
  const loading = useRef(false);

  const wake = () => {
    if (loading.current) return;
    loading.current = true;
    loadForm().then((C) => {
      // Take over whatever was typed while the code was on its way.
      const input = ref.current?.querySelector<HTMLInputElement>("input[type=email]");
      if (input) carry.current = { value: input.value, focus: document.activeElement === input };
      setForm(() => C);
    });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || Form) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && wake(), {
      rootMargin: "600px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  });

  useLayoutEffect(() => {
    if (!Form || !carry.current) return;
    const input = ref.current?.querySelector<HTMLInputElement>("input[type=email]");
    if (input) {
      if (carry.current.value) {
        // Through the native setter plus an input event, so the form library sees it as typed.
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, carry.current.value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (carry.current.focus) input.focus();
    }
    carry.current = null;
  }, [Form]);

  return <div ref={ref}>{Form ? <Form {...props} /> : <Placeholder onWake={wake} />}</div>;
}
