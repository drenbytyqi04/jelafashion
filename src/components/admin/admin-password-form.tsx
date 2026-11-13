"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { adminSignIn } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().trim().min(1, "Shkruaj email-in.").email("Shkruaj një email të vlefshëm."),
  password: z.string().min(1, "Shkruaj fjalëkalimin."),
});
type Values = z.infer<typeof schema>;

/** The atelier's password sign-in to the admin panel (the admin is in Albanian). */
export function AdminPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: "onTouched" });

  const onSubmit = (values: Values) =>
    startTransition(async () => {
      setError(null);
      const res = await adminSignIn(values);
      if (res.ok) {
        // The action set the session cookies; refresh so the panel renders signed in.
        router.replace("/admin");
        router.refresh();
        return;
      }
      setError(
        res.error === "rateLimited"
          ? "Shumë përpjekje. Provo sërish pas 15 minutash."
          : res.error === "unavailable"
            ? "Hyrja nuk është e disponueshme tani."
            : "Email-i ose fjalëkalimi nuk janë të sakta.",
      );
    });

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="font-serif text-h2 font-light">Paneli i ateljes</h1>
      <p className="mt-4 text-body text-stone">Hyr me email-in dhe fjalëkalimin e ateljes.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10 flex flex-col gap-6">
        {error && (
          <p role="alert" className="border border-error px-5 py-4 text-small text-error">
            {error}
          </p>
        )}
        <Input
          id="admin-email"
          type="email"
          inputMode="email"
          autoComplete="username"
          spellCheck={false}
          label="Email"
          error={errors.email?.message}
          {...register("email")}
        />
        <div className="relative">
          <Input
            id="admin-password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            label="Fjalëkalimi"
            error={errors.password?.message}
            className="[&_input]:pr-14"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
            aria-pressed={show}
            className="absolute right-2 top-[calc(1.5rem+4px)] flex size-11 items-center justify-center text-stone hover:text-ink"
          >
            {show ? <EyeOff aria-hidden size={18} strokeWidth={1.25} /> : <Eye aria-hidden size={18} strokeWidth={1.25} />}
          </button>
        </div>
        <Button type="submit" loading={pending} className="w-full">
          Hyr
        </Button>
      </form>
    </div>
  );
}
