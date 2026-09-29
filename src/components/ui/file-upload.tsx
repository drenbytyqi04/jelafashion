"use client";

import { FileText, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useState, type DragEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { describedBy, FieldError, FieldHint, FieldLabel } from "./field";

const DEFAULT_ACCEPT = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export type FileUploadProps = {
  label: ReactNode;
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string[];
  maxSizeMB?: number;
  /** Error from the parent form; local type/size errors are handled here. */
  error?: ReactNode;
  optionalLabel?: string;
  name?: string;
  className?: string;
};

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileUpload({
  label,
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 10,
  error,
  optionalLabel,
  name,
  className,
}: FileUploadProps) {
  const t = useTranslations("upload");
  const common = useTranslations("common");
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const preview = useMemo(
    () => (value && value.type.startsWith("image/") ? URL.createObjectURL(value) : null),
    [value],
  );
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!accept.includes(file.type)) {
      setLocalError(t("typeError"));
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(t("sizeError", { size: maxSizeMB }));
      return;
    }
    setLocalError(null);
    onChange(file);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  const shownError = localError ?? error;
  const hint = t("hint", { size: maxSizeMB });

  return (
    <div className={className}>
      <FieldLabel htmlFor={id} optionalLabel={optionalLabel}>
        {label}
      </FieldLabel>

      {value ? (
        <div className="flex items-center gap-4 border border-field p-3">
          {preview ? (
            // Local blob preview; next/image cannot optimise object URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-16 shrink-0 object-cover" />
          ) : (
            <span className="flex size-16 shrink-0 items-center justify-center bg-linen">
              <FileText aria-hidden size={24} strokeWidth={1.25} />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-small text-ink">{value.name}</span>
            <span className="nums block text-small text-stone">{formatSize(value.size)}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setLocalError(null);
            }}
            className="flex size-11 shrink-0 items-center justify-center text-ink"
            aria-label={`${common("remove")}: ${value.name}`}
          >
            <X aria-hidden size={20} strokeWidth={1.25} />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex min-h-36 flex-col items-center justify-center gap-3 border border-dashed px-6 py-8 text-center",
            "transition-colors duration-(--duration-micro) has-[:focus-visible]:border-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink",
            dragging ? "border-ink bg-linen" : "border-field hover:border-ink",
            shownError && "border-error",
          )}
        >
          <Upload aria-hidden size={22} strokeWidth={1.25} />
          <span className="text-small text-ink">
            {t("prompt")} <span className="link-underline">{t("choose")}</span>
          </span>
          <input
            id={id}
            name={name}
            type="file"
            accept={accept.join(",")}
            aria-invalid={shownError ? true : undefined}
            aria-describedby={describedBy(id, hint, shownError)}
            className="sr-only"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      <FieldHint id={id}>{hint}</FieldHint>
      <FieldError id={id}>{shownError}</FieldError>
    </div>
  );
}
