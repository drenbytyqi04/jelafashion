"use client";

import { ArrowLeft, Check, Pencil, TriangleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Dialog } from "radix-ui";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Locale, MeasurementDefinition } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { duration, ease } from "@/lib/motion";
import { formatMeasure, parseMeasure, toCm, toUnit, type Unit } from "@/lib/units";
import { myMeasurementProfiles, saveMeasurementProfile } from "@/app/actions/account";
import type { MeasurementProfile } from "@/lib/account/types";
import { useSavedMeasurements } from "@/stores/saved-measurements";
import { toast } from "@/stores/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useLenisLock } from "@/components/motion/use-scroll-lock";
import { MeasurementIllustration } from "./figures";

export type WizardResult = {
  /** Centimetres, in wizard order, with the labels shown to the customer. */
  measurements: { id: string; cm: number; label: { sq: string; en: string } }[];
  unit: Unit;
  notes: string;
};

type WarningKey = "underbust" | "waistHips" | "hollowFloor";

const INTRO = -1;

/** Soft checks on implausible combinations. Returns the first that applies. */
function findWarning(id: string, cm: number, values: Record<string, number>): WarningKey | null {
  if (id === "underbust" && values.bust != null && cm >= values.bust) return "underbust";
  if (id === "bust" && values.underbust != null && values.underbust >= cm) return "underbust";
  if (id === "hips" && values.waist != null && values.waist > cm + 25) return "waistHips";
  if (id === "waist" && values.hips != null && cm > values.hips + 25) return "waistHips";
  if (id === "hollow_to_floor" && values.height != null && cm > values.height * 0.9) return "hollowFloor";
  if (id === "height" && values.hollow_to_floor != null && values.hollow_to_floor > cm * 0.9) return "hollowFloor";
  return null;
}

export function MeasurementWizard({
  open,
  onOpenChange,
  productName,
  definitions,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  /** Measurements this dress needs, in order. */
  definitions: MeasurementDefinition[];
  onComplete: (result: WizardResult) => void;
}) {
  const t = useTranslations("wizard");
  const locale = useLocale() as Locale;
  const saved = useSavedMeasurements();
  useLenisLock(open);

  const total = definitions.length;
  const summaryStep = total;
  const [step, setStep] = useState(INTRO);
  const [dir, setDir] = useState<1 | -1>(1);
  const [unit, setUnit] = useState<Unit>("cm");
  const [values, setValues] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<WarningKey | null>(null);
  const [confirmed, setConfirmed] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [remember, setRemember] = useState(true);
  // Signed-in customers: their named profiles (null while signed out or unknown).
  const [accountProfiles, setAccountProfiles] = useState<MeasurementProfile[] | null>(null);
  const [fromProfile, setFromProfile] = useState<MeasurementProfile | null>(null);
  const [saveToAccount, setSaveToAccount] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const closingRef = useRef(false);

  const hasSaved = definitions.some((d) => saved.values[d.id] != null);
  const current = step >= 0 && step < total ? definitions[step] : null;
  const unitLabel = unit === "cm" ? "cm" : locale === "sq" ? "inç" : "in";

  // Start fresh each time the wizard opens.
  const reset = useCallback(() => {
    setStep(INTRO);
    setDir(1);
    setValues({});
    setDraft("");
    setError(null);
    setWarning(null);
    setConfirmed({});
    setEditing(false);
    setNotes("");
    setFromProfile(null);
    setProfileName("");
  }, []);

  const goTo = useCallback(
    (next: number, direction: 1 | -1) => {
      setDir(direction);
      setError(null);
      setWarning(null);
      setStep(next);
      const def = next >= 0 && next < total ? definitions[next] : null;
      setDraft(def && values[def.id] != null ? formatMeasure(toUnit(values[def.id], unit), locale) : "");
    },
    [definitions, locale, total, unit, values],
  );

  const hasProgress = Object.keys(values).length > 0;

  const close = useCallback(() => {
    closingRef.current = true;
    onOpenChange(false);
    // Pop the history entry pushed on open, if it is still the current one.
    if (typeof window !== "undefined" && window.history.state?.jfWizard) window.history.back();
    window.setTimeout(() => {
      closingRef.current = false;
    }, 50);
  }, [onOpenChange]);

  const requestClose = useCallback(() => {
    if (hasProgress && step !== summaryStep) setLeaveOpen(true);
    else close();
  }, [close, hasProgress, step, summaryStep]);

  // Android/browser Back moves one step back instead of leaving the page.
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ ...window.history.state, jfWizard: true }, "");
    const onPop = () => {
      if (closingRef.current) return;
      const s = stepRef.current;
      if (s === INTRO) {
        onOpenChange(false);
        return;
      }
      window.history.pushState({ ...window.history.state, jfWizard: true }, "");
      document.dispatchEvent(new CustomEvent("jf-wizard-back"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, onOpenChange]);

  const back = useCallback(() => {
    if (editing) {
      setEditing(false);
      goTo(summaryStep, -1);
      return;
    }
    if (step > INTRO) goTo(step - 1, -1);
  }, [editing, goTo, step, summaryStep]);

  useEffect(() => {
    const onBack = () => back();
    document.addEventListener("jf-wizard-back", onBack);
    return () => document.removeEventListener("jf-wizard-back", onBack);
  }, [back]);

  // Focus the field once the slide has settled (on mobile this raises the keyboard).
  useEffect(() => {
    if (!open || !current) return;
    const id = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), duration.ui * 1000 + 20);
    return () => window.clearTimeout(id);
  }, [open, current]);

  // Ask the server once per opening whether she is signed in and has saved profiles.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    myMeasurementProfiles()
      .then((profiles) => !cancelled && setAccountProfiles(profiles))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open]);

  function startWithProfile(p: MeasurementProfile) {
    const prefill: Record<string, number> = {};
    for (const d of definitions) if (p.measurements[d.id] != null) prefill[d.id] = p.measurements[d.id];
    setFromProfile(p);
    setProfileName(p.name);
    setValues(prefill);
    setUnit(p.unit);
    setDir(1);
    setStep(0);
    const first = definitions[0];
    setDraft(prefill[first.id] != null ? formatMeasure(toUnit(prefill[first.id], p.unit), locale) : "");
  }

  function start(useSavedValues: boolean) {
    if (useSavedValues) {
      const prefill: Record<string, number> = {};
      for (const d of definitions) if (saved.values[d.id] != null) prefill[d.id] = saved.values[d.id];
      setValues(prefill);
      setUnit(saved.unit);
      setDir(1);
      setStep(0);
      const first = definitions[0];
      setDraft(prefill[first.id] != null ? formatMeasure(toUnit(prefill[first.id], saved.unit), locale) : "");
      return;
    }
    goTo(0, 1);
  }

  function submitStep(e?: FormEvent) {
    e?.preventDefault();
    if (!current) return;
    if (!draft.trim()) return setError(t("errors.required"));
    const parsed = parseMeasure(draft);
    if (parsed == null) return setError(t("errors.invalid"));
    const cm = toCm(parsed, unit);
    if (cm < current.minCm - 0.05 || cm > current.maxCm + 0.05) {
      return setError(
        t("errors.range", {
          min: formatMeasure(toUnit(current.minCm, unit), locale),
          max: formatMeasure(toUnit(current.maxCm, unit), locale),
          unit: unitLabel,
        }),
      );
    }
    const next = { ...values, [current.id]: cm };
    const w = findWarning(current.id, cm, values);
    if (w && confirmed[current.id] !== cm) {
      setError(null);
      setWarning(w);
      return;
    }
    setValues(next);
    advance(next);
  }

  function advance(nextValues: Record<string, number>) {
    setError(null);
    setWarning(null);
    const target = editing ? summaryStep : step + 1;
    if (editing) setEditing(false);
    setDir(1);
    setStep(target);
    const def = target < total ? definitions[target] : null;
    setDraft(def && nextValues[def.id] != null ? formatMeasure(toUnit(nextValues[def.id], unit), locale) : "");
  }

  function acceptWarning() {
    if (!current) return;
    const parsed = parseMeasure(draft);
    if (parsed == null) return;
    const cm = toCm(parsed, unit);
    setConfirmed((c) => ({ ...c, [current.id]: cm }));
    const next = { ...values, [current.id]: cm };
    setValues(next);
    advance(next);
  }

  function confirmAll() {
    const measurements = definitions.map((d) => ({ id: d.id, cm: Math.round(values[d.id] * 10) / 10, label: d.label }));
    const byId = Object.fromEntries(measurements.map((m) => [m.id, m.cm]));
    if (accountProfiles !== null) {
      if (saveToAccount) {
        const name = profileName.trim() || t("defaultProfileName");
        // Merged, so a dress that asks fewer measurements never erases the others.
        void saveMeasurementProfile({
          id: fromProfile?.id,
          name,
          unit,
          notes: notes.trim() || fromProfile?.notes || undefined,
          measurements: { ...fromProfile?.measurements, ...byId },
        }).then((res) => res.ok && toast({ title: t("savedToAccount", { name }) }));
      }
    } else if (remember) saved.save(byId, unit);
    onComplete({ measurements, unit, notes: notes.trim() });
    closingRef.current = true;
    if (window.history.state?.jfWizard) window.history.back();
    window.setTimeout(() => {
      closingRef.current = false;
    }, 50);
    reset();
  }

  const progress = step === INTRO ? 0 : step >= total ? 1 : (step + 1) / total;
  const view = current?.view ?? "front";
  const slide = {
    initial: { opacity: 0, x: 24 * dir },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 * dir },
    transition: { duration: duration.ui, ease: ease.couture },
  };

  const summaryRows = useMemo(
    () =>
      definitions.map((d, i) => ({
        def: d,
        index: i,
        value: values[d.id] != null ? `${formatMeasure(toUnit(values[d.id], unit), locale)} ${unitLabel}` : "—",
      })),
    [definitions, locale, unit, unitLabel, values],
  );

  return (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={(o) => {
          if (!o) requestClose();
        }}
      >
        <AnimatePresence onExitComplete={reset}>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  data-lenis-prevent
                  className="wizard fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ivory focus:outline-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: duration.ui, ease: ease.couture }}
                >
                  {/* Top bar */}
                  <div className="sticky top-0 z-10 bg-ivory">
                    <div className="container-page flex min-h-14 items-center justify-between gap-4">
                      <div className="min-w-0">
                        <Dialog.Title className="font-serif text-[1.25rem] leading-tight">{t("title")}</Dialog.Title>
                        <p className="truncate text-small text-stone">{t("for", { name: productName })}</p>
                      </div>
                      <button
                        type="button"
                        onClick={requestClose}
                        aria-label={t("close")}
                        className="-mr-3 flex size-11 shrink-0 items-center justify-center"
                      >
                        <X aria-hidden size={22} strokeWidth={1.25} />
                      </button>
                    </div>
                    <div className="relative h-px bg-hairline" aria-hidden>
                      <span
                        className="absolute inset-y-0 left-0 block origin-left bg-champagne transition-transform duration-(--duration-ui) ease-(--ease-couture)"
                        style={{ width: "100%", transform: `scaleX(${progress})` }}
                      />
                    </div>
                    {current && (
                      <p className="container-page label py-3 text-stone" aria-live="polite">
                        {t("stepOf", { current: step + 1, total })}
                      </p>
                    )}
                  </div>

                  <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-col md:grid md:grid-cols-2 md:items-center md:gap-10 md:px-10 md:py-10">
                    {/* Illustration */}
                    <div
                      className={cn(
                        "wizard-figure relative flex h-[42vh] max-h-[360px] shrink-0 items-center justify-center bg-blush transition-[height] duration-(--duration-ui) md:h-[560px] md:max-h-none",
                        // The summary is a list to check; on phones it gets the whole screen.
                        step === summaryStep && "max-md:hidden",
                      )}
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                          key={step === summaryStep ? "summary" : view}
                          className="absolute inset-0 flex items-center justify-center p-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: duration.ui }}
                        >
                          <MeasurementIllustration
                            view={view}
                            measurementId={current?.id}
                            className="h-full w-auto"
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Step content */}
                    <div className="relative flex flex-1 flex-col overflow-hidden md:overflow-visible">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div key={`${step}-${editing}`} className="container-page flex flex-1 flex-col pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 md:px-0 md:pt-0" {...slide}>
                          {step === INTRO && (
                            <div className="flex flex-1 flex-col">
                              <h2 className="font-serif text-h3">{t("introTitle")}</h2>
                              <ul className="mt-4 flex flex-col gap-2">
                                {(t.raw("introTips") as string[]).map((tip) => (
                                  <li key={tip} className="flex gap-3 text-body">
                                    <Check aria-hidden size={18} strokeWidth={1.25} className="mt-1 shrink-0 text-gold-ink" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                              <fieldset className="mt-8">
                                <legend className="label mb-3 text-stone">{t("unitLegend")}</legend>
                                <div className="grid grid-cols-2 border border-field" role="radiogroup">
                                  {(["cm", "in"] as const).map((u) => (
                                    <label
                                      key={u}
                                      className={cn(
                                        "flex min-h-12 items-center justify-center gap-2 text-small transition-colors",
                                        unit === u ? "bg-ink text-ivory" : "text-ink hover:bg-linen",
                                      )}
                                    >
                                      <input
                                        type="radio"
                                        name="wizard-unit"
                                        value={u}
                                        checked={unit === u}
                                        onChange={() => setUnit(u)}
                                        className="sr-only"
                                      />
                                      {u === "cm" ? t("unitCm") : t("unitIn")}
                                    </label>
                                  ))}
                                </div>
                              </fieldset>
                              <div className="mt-auto flex flex-col gap-3 pt-8">
                                {accountProfiles && accountProfiles.length > 0 && (
                                  <div className="flex flex-col gap-3">
                                    <p className="label text-stone">{t("accountProfiles")}</p>
                                    {accountProfiles.slice(0, 3).map((p) => (
                                      <Button key={p.id} onClick={() => startWithProfile(p)} className="w-full">
                                        {t("useProfile", { name: p.name })}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                                {hasSaved && !accountProfiles?.length && (
                                  <>
                                    <Button onClick={() => start(true)} className="w-full">
                                      {t("useSaved")}
                                    </Button>
                                    <p className="text-small text-stone">{t("savedNote")}</p>
                                  </>
                                )}
                                <Button
                                  variant={hasSaved || accountProfiles?.length ? "secondary" : "primary"}
                                  onClick={() => start(false)}
                                  className="w-full"
                                >
                                  {t("start")}
                                </Button>
                              </div>
                            </div>
                          )}

                          {current && (
                            <form onSubmit={submitStep} noValidate className="flex flex-1 flex-col">
                              <h2 className="font-serif text-[1.75rem] leading-tight md:text-h3">
                                <label htmlFor="wizard-input">{pick(current.label, locale)}</label>
                              </h2>
                              <p id="wizard-hint" className="mt-2 text-small text-stone">
                                {pick(current.hint, locale)}
                              </p>
                              <div className="relative mt-6">
                                <input
                                  ref={inputRef}
                                  id="wizard-input"
                                  inputMode="decimal"
                                  autoComplete="off"
                                  enterKeyHint={editing || step === total - 1 ? "done" : "next"}
                                  value={draft}
                                  onChange={(e) => {
                                    setDraft(e.target.value);
                                    if (error) setError(null);
                                    if (warning) setWarning(null);
                                  }}
                                  aria-label={t("valueLabel", { label: pick(current.label, locale), unit: unitLabel })}
                                  aria-invalid={error ? true : undefined}
                                  aria-describedby={cn("wizard-hint", error && "wizard-error", warning && "wizard-warning")}
                                  className={cn(
                                    "nums h-16 w-full border bg-ivory pl-4 pr-16 font-serif text-[2rem] text-ink placeholder:text-stone/60 hover:border-ink",
                                    error ? "border-error" : "border-field",
                                  )}
                                  placeholder={unit === "cm" ? "0" : "0"}
                                />
                                <span aria-hidden className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-body text-stone">
                                  {unitLabel}
                                </span>
                              </div>
                              <p id="wizard-error" role="alert" className={cn("text-small text-error", error ? "mt-2" : "sr-only")}>
                                {error}
                              </p>

                              {warning && (
                                <div id="wizard-warning" role="alert" className="mt-4 border border-gold-ink/60 bg-linen p-4">
                                  <p className="flex gap-2 text-small text-ink">
                                    <TriangleAlert aria-hidden size={18} strokeWidth={1.25} className="mt-0.5 shrink-0 text-gold-ink" />
                                    {t(`warnings.${warning}`)}
                                  </p>
                                  <div className="mt-4 grid grid-cols-2 gap-3">
                                    <Button variant="secondary" size="sm" onClick={() => inputRef.current?.focus()}>
                                      {t("checkAgain")}
                                    </Button>
                                    <Button size="sm" onClick={acceptWarning}>
                                      {t("itsCorrect")}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {!warning && (
                                <div className="mt-auto grid grid-cols-[auto_1fr] gap-3 pt-8">
                                  <Button variant="secondary" onClick={back} aria-label={editing ? t("backToSummary") : t("back")} className="px-5">
                                    <ArrowLeft aria-hidden size={18} strokeWidth={1.25} />
                                  </Button>
                                  <Button type="submit">{editing ? t("backToSummary") : step === total - 1 ? t("review") : t("next")}</Button>
                                </div>
                              )}
                            </form>
                          )}

                          {step === summaryStep && (
                            <div className="flex flex-1 flex-col">
                              <h2 className="font-serif text-h3">{t("summaryTitle")}</h2>
                              <p className="mt-2 text-small text-stone">{t("summaryText")}</p>
                              <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
                                {summaryRows.map(({ def, index, value }) => (
                                  <li key={def.id}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditing(true);
                                        goTo(index, -1);
                                      }}
                                      aria-label={t("edit", { label: pick(def.label, locale) })}
                                      className="group flex min-h-12 w-full items-center justify-between gap-4 py-2 text-left"
                                    >
                                      <span className="text-small">{pick(def.label, locale)}</span>
                                      <span className="flex items-center gap-3">
                                        <span className="nums whitespace-nowrap font-serif text-[1.125rem]">{value}</span>
                                        <Pencil aria-hidden size={14} strokeWidth={1.25} className="text-stone group-hover:text-ink" />
                                      </span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              <Textarea
                                className="mt-6"
                                label={t("notesLabel")}
                                hint={t("notesHint")}
                                optionalLabel={locale === "sq" ? "opsionale" : "optional"}
                                rows={3}
                                maxLength={600}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                              />
                              {accountProfiles !== null ? (
                                <div className="mt-2">
                                  <Checkbox
                                    label={t("saveToAccount")}
                                    checked={saveToAccount}
                                    onChange={(e) => setSaveToAccount(e.target.checked)}
                                  />
                                  {saveToAccount && (
                                    <Input
                                      className="mt-3"
                                      label={t("profileName")}
                                      value={profileName}
                                      placeholder={t("defaultProfileName")}
                                      maxLength={60}
                                      onChange={(e) => setProfileName(e.target.value)}
                                    />
                                  )}
                                </div>
                              ) : (
                                <Checkbox
                                  className="mt-2"
                                  label={t("remember")}
                                  checked={remember}
                                  onChange={(e) => setRemember(e.target.checked)}
                                />
                              )}
                              <div className="mt-auto pt-6">
                                <Button onClick={confirmAll} className="w-full">
                                  {t("confirmAdd")}
                                </Button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>

      <Modal
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title={t("leaveTitle")}
        description={t("leaveText")}
        actions={
          <>
            <Button onClick={() => setLeaveOpen(false)}>{t("keep")}</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setLeaveOpen(false);
                close();
              }}
            >
              {t("leave")}
            </Button>
          </>
        }
      />
    </>
  );
}
