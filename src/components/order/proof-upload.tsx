"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { finishProofUpload, startProofUpload, uploadPaymentProof, type ProofResult } from "@/app/actions/payment-proof";
import { putToSignedUrl } from "@/lib/storage/upload-client";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";

export function ProofUpload({ token, cash }: { token: string; cash: boolean }) {
  const t = useTranslations("order");
  const tu = useTranslations("upload");
  const tc = useTranslations("common");
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [sender, setSender] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  /** Straight to storage when Supabase hands out a signed URL; through the server otherwise. */
  async function upload(f: File): Promise<ProofResult> {
    const start = await startProofUpload({ token, contentType: f.type, size: f.size });
    if (!start.ok) return start;
    if (start.ticket.mode === "signed") {
      try {
        await putToSignedUrl(start.ticket.signedUrl, f);
      } catch {
        return { ok: false, error: "failure" };
      }
      return finishProofUpload({ token, path: start.ticket.path, fileName: f.name, reference, senderName: sender });
    }
    const data = new FormData();
    data.set("token", token);
    data.set("file", f);
    data.set("reference", reference);
    data.set("senderName", sender);
    return uploadPaymentProof(data);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return setError(t("proofFileRequired"));
    startTransition(async () => {
      const res = await upload(file);
      if (!res.ok) {
        setError(
          res.error === "type" ? tu("typeError") : res.error === "size" ? tu("sizeError", { size: 10 }) : res.error === "file" ? t("proofFileRequired") : t("proofFailure"),
        );
        return;
      }
      setSent(true);
      setFile(null);
      setReference("");
      setSender("");
      setError(null);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      {sent && (
        <p role="status" className="border border-success px-5 py-4 text-small text-success">
          {t("proofSent")}
        </p>
      )}
      <FileUpload
        label={t("proofFile")}
        value={file}
        onChange={(f) => {
          setFile(f);
          if (f) setError(null);
        }}
        error={error ?? undefined}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          label={t("proofReference")}
          optionalLabel={cash ? undefined : tc("optional")}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          maxLength={80}
          autoComplete="off"
          spellCheck={false}
        />
        <Input
          label={t("proofSender")}
          optionalLabel={tc("optional")}
          value={sender}
          onChange={(e) => setSender(e.target.value)}
          maxLength={120}
          autoComplete="name"
        />
      </div>
      <Button type="submit" variant="secondary" loading={pending} className="self-start">
        {t("proofSubmit")}
      </Button>
    </form>
  );
}
