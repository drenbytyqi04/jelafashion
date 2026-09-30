"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function ConfirmDelete({
  open,
  onOpenChange,
  title,
  onConfirm,
  pending,
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirm: () => void;
  pending?: boolean;
  confirmLabel: string;
}) {
  const t = useTranslations("account.addresses");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      actions={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
