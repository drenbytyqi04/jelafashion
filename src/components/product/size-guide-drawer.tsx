"use client";

import { useTranslations } from "next-intl";
import { Drawer } from "@/components/ui/drawer";
import { SizeChart } from "./size-chart";

export function SizeGuideDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("sizeGuide");

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={t("title")} description={t("text")}>
      <SizeChart />

      <h3 className="label mt-10 font-sans text-stone">{t("howTo")}</h3>
      <dl className="mt-3 flex flex-col gap-3 text-small">
        {(["bust", "waist", "hips"] as const).map((k) => (
          <div key={k}>
            <dt className="font-medium">{t(k)}</dt>
            <dd className="text-stone">{t(`howTo${k[0].toUpperCase()}${k.slice(1)}` as "howToBust")}</dd>
          </div>
        ))}
      </dl>
    </Drawer>
  );
}
