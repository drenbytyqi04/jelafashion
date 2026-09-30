"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  CreditCard,
  HandCoins,
  Landmark,
  Send,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  Controller,
  useForm,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import { placeOrder } from "@/app/actions/checkout";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import {
  orderTotals,
  shippingAmount,
  zoneForCountry,
} from "@/lib/commerce/pricing";
import type {
  Discount,
  PaymentMethodConfig,
  PaymentMethodId,
  ShippingZone,
} from "@/lib/commerce/types";
import type { SavedAddress } from "@/lib/account/types";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/tracking/track";
import { duration, ease } from "@/lib/motion";
import {
  checkoutSchema,
  type CheckoutFormValues,
} from "@/lib/validation/checkout";
import { selectCartSubtotal, useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorSummary, type SummaryError } from "@/components/ui/error-summary";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCartHydrated } from "@/components/cart/use-cart-hydrated";
import { useReducedMotionSafe } from "@/components/motion/use-reduced-motion-safe";
import { DiscountField, SummaryLines, TotalsTable } from "./order-summary";

export type CountryOption = { code: string; name: string; callingCode: string };

/** Signed-in customer's details for prefilling; null for guests. */
export type CheckoutAccount = { email: string; phoneCountry: string | null; phone: string | null; addresses: SavedAddress[] };

type Props = {
  zones: ShippingZone[];
  methods: PaymentMethodConfig[];
  countries: CountryOption[];
  defaultCountry: string;
  account: CheckoutAccount | null;
  /** Account page with a return to checkout, for the sign-in prompt. */
  signInHref: string;
};

const METHOD_ICONS: Record<PaymentMethodId, ReactNode> = {
  paysera: <CreditCard aria-hidden size={22} strokeWidth={1.25} />,
  bank_transfer: <Landmark aria-hidden size={22} strokeWidth={1.25} />,
  cash_agency: <HandCoins aria-hidden size={22} strokeWidth={1.25} />,
  wise: <Send aria-hidden size={22} strokeWidth={1.25} />,
};

const ADDRESS_FIELDS = [
  "firstName",
  "lastName",
  "line1",
  "line2",
  "city",
  "postalCode",
  "region",
  "country",
] as const;
type AddressField = (typeof ADDRESS_FIELDS)[number];

const AUTOCOMPLETE: Record<AddressField, string> = {
  firstName: "given-name",
  lastName: "family-name",
  line1: "address-line1",
  line2: "address-line2",
  city: "address-level2",
  postalCode: "postal-code",
  region: "address-level1",
  country: "country",
};

const fieldId = (path: string) => `checkout-${path.replace(/\./g, "-")}`;

/** Field order for the error summary, matching the page. */
const FIELD_ORDER = [
  "email",
  "phone",
  ...ADDRESS_FIELDS.map((f) => `shipping.${f}`),
  "shippingRateId",
  "paymentMethod",
  ...ADDRESS_FIELDS.map((f) => `billing.${f}`),
  "note",
  "terms",
];

function addressValues(a: SavedAddress | null, country: string) {
  return {
    firstName: a?.firstName ?? "",
    lastName: a?.lastName ?? "",
    line1: a?.line1 ?? "",
    line2: a?.line2 ?? "",
    city: a?.city ?? "",
    postalCode: a?.postalCode ?? "",
    region: a?.region ?? "",
    country: a?.country ?? country,
  };
}

function flatten(
  errors: FieldErrors,
  prefix = "",
): { path: string; message: string }[] {
  return Object.entries(errors).flatMap(([key, value]) => {
    if (!value || typeof value !== "object") return [];
    const path = prefix ? `${prefix}.${key}` : key;
    if ("message" in value && typeof value.message === "string")
      return [{ path, message: value.message }];
    return flatten(value as FieldErrors, path);
  });
}

export function CheckoutView({
  zones,
  methods,
  countries,
  defaultCountry,
  account,
  signInHref,
}: Props) {
  const t = useTranslations("checkout");
  const tf = useTranslations("forms");
  const tc = useTranslations("cart");
  const tcommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const reduce = useReducedMotionSafe();
  const hydrated = useCartHydrated();
  const lines = useCartStore((s) => s.lines);
  const subtotalEUR = useCartStore(selectCartSubtotal);
  const patchLine = useCartStore((s) => s.patch);
  const removeLine = useCartStore((s) => s.remove);
  const clearCart = useCartStore((s) => s.clear);

  const [discount, setDiscount] = useState<Discount | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [placing, startPlacing] = useTransition();
  const [leaving, setLeaving] = useState(false);

  const savedAddresses = account?.addresses ?? [];
  const initialAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;
  const [addressChoice, setAddressChoice] = useState<string>(initialAddress?.id ?? "new");
  const [saveAddress, setSaveAddress] = useState(true);
  const initialCountry = initialAddress?.country ?? defaultCountry;
  const firstZone = zoneForCountry(zones, initialCountry);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, submitCount },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: {
      email: account?.email ?? "",
      phoneCountry: account?.phoneCountry ?? initialCountry,
      phone: account?.phone ?? "",
      marketing: false,
      shipping: addressValues(initialAddress, initialCountry),
      shippingRateId: firstZone?.rates[0]?.id ?? "",
      paymentMethod: undefined,
      billingSame: true,
      note: "",
      terms: false,
    },
  });

  const country = useWatch({ control, name: "shipping.country" });
  const rateId = useWatch({ control, name: "shippingRateId" });
  const method = useWatch({ control, name: "paymentMethod" });
  const billingSame = useWatch({ control, name: "billingSame" });

  const zone = useMemo(() => zoneForCountry(zones, country), [zones, country]);
  const rate = zone?.rates.find((r) => r.id === rateId) ?? null;

  // A new country brings its own rates; keep the choice if it still exists.
  useEffect(() => {
    if (!zone?.rates.some((r) => r.id === getValues("shippingRateId"))) {
      setValue("shippingRateId", zone?.rates[0]?.id ?? "");
    }
    if (!getValues("phone")) setValue("phoneCountry", country);
  }, [zone, country, getValues, setValue]);

  // One begin_checkout per visit to the page, once the saved cart has loaded.
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (!hydrated || checkoutTracked.current || lines.length === 0) return;
    checkoutTracked.current = true;
    const items = lines.map((l) => ({ id: l.slug, name: l.name, price: l.priceEUR, quantity: l.quantity, variant: l.size }));
    track({ name: "begin_checkout", items, value: items.reduce((n, i) => n + i.price * i.quantity, 0) });
  }, [hydrated, lines]);

  const subtotalCents = Math.round(subtotalEUR * 100);
  const computed = orderTotals(subtotalCents, discount, rate);
  const totals = {
    ...computed,
    shippingCents: rate ? computed.shippingCents : null,
  };

  const message = (key: string) =>
    key === "required" || key === "email"
      ? tf(key)
      : t(`errors.${key}` as "errors.phone");
  const err = (path: string) => {
    const found = flatten(errors).find((e) => e.path === path);
    return found ? message(found.message) : undefined;
  };
  const summaryErrors: SummaryError[] = flatten(errors)
    .sort((a, b) => FIELD_ORDER.indexOf(a.path) - FIELD_ORDER.indexOf(b.path))
    .map((e) => ({ fieldId: fieldId(e.path), message: message(e.message) }));

  const countryOptions = useMemo(
    () => countries.map((c) => ({ value: c.code, label: c.name })),
    [countries],
  );
  const callingOptions = useMemo(
    () =>
      countries.map((c) => ({
        value: c.code,
        label: `+${c.callingCode} ${c.name}`,
      })),
    [countries],
  );

  function onSubmit(values: CheckoutFormValues) {
    setFormError(null);
    startPlacing(async () => {
      const res = await placeOrder({
        values: { ...values, discountCode: discount?.code },
        lines,
        saveAddress: Boolean(account) && addressChoice === "new" && saveAddress,
      });
      if (res.ok) {
        setLeaving(true);
        clearCart();
        window.location.assign(res.redirect);
        return;
      }
      if (res.error === "cartChanged" && res.changes) {
        for (const c of res.changes) {
          if (c.removed) removeLine(c.key);
          else
            patchLine(c.key, {
              ...(c.priceEUR !== undefined && { priceEUR: c.priceEUR }),
              ...(c.quantity !== undefined && { quantity: c.quantity }),
            });
        }
      }
      if (res.error === "discountExpired") setDiscount(null);
      const key =
        res.error === "invalid"
          ? "failure"
          : res.error === "paymentMethod"
            ? "failure"
            : res.error;
      setFormError(t(`errors.${key}`));
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  if (!hydrated) {
    return (
      <div
        aria-hidden
        className="container-page grid gap-10 py-10 lg:grid-cols-12"
      >
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-[52px]" />
          <Skeleton className="h-[52px]" />
          <Skeleton className="h-[52px]" />
        </div>
        <Skeleton className="hidden h-96 lg:col-span-5 lg:block" />
      </div>
    );
  }

  if (lines.length === 0 && !leaving) {
    return (
      <div className="container-page max-w-xl py-24">
        <h1 className="font-serif text-h2 font-light">{t("title")}</h1>
        <p className="mt-4 text-body text-stone">{t("empty")}</p>
        <Button asChild variant="secondary" className="mt-8">
          <Link href="/shop">{tc("emptyCta")}</Link>
        </Button>
      </div>
    );
  }

  const madeToOrder = lines.some((l) => l.size === "custom");
  const summaryId = "checkout-summary-mobile";

  const summary = (
    <>
      <SummaryLines lines={lines} />
      <div className="mt-6 border-t border-hairline pt-6">
        <DiscountField
          subtotalCents={subtotalCents}
          applied={discount}
          onApply={setDiscount}
        />
      </div>
      <TotalsTable
        totals={totals}
        discountCode={discount?.code}
        className="mt-6 border-t border-hairline pt-6"
      />
      <p className="mt-4 text-small text-stone">{t("currencyNote")}</p>
    </>
  );

  const addressFields = (prefix: "shipping" | "billing") => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6">
      <Controller
        control={control}
        name={`${prefix}.country` as "shipping.country"}
        render={({ field }) => (
          <Select
            id={fieldId(`${prefix}.country`)}
            label={t("country")}
            options={countryOptions}
            autoComplete={`${prefix === "billing" ? "billing" : "shipping"} ${AUTOCOMPLETE.country}`}
            error={err(`${prefix}.country`)}
            className="col-span-2"
            {...field}
            value={field.value ?? ""}
          />
        )}
      />
      {(["firstName", "lastName"] as const).map((f) => (
        <Input
          key={f}
          id={fieldId(`${prefix}.${f}`)}
          label={t(f)}
          autoComplete={`${prefix === "billing" ? "billing" : "shipping"} ${AUTOCOMPLETE[f]}`}
          error={err(`${prefix}.${f}`)}
          className="max-sm:col-span-2"
          {...register(`${prefix}.${f}` as "shipping.firstName")}
        />
      ))}
      <Input
        id={fieldId(`${prefix}.line1`)}
        label={t("address1")}
        autoComplete={`${prefix === "billing" ? "billing" : "shipping"} ${AUTOCOMPLETE.line1}`}
        error={err(`${prefix}.line1`)}
        className="col-span-2"
        {...register(`${prefix}.line1` as "shipping.line1")}
      />
      <Input
        id={fieldId(`${prefix}.line2`)}
        label={t("address2")}
        optionalLabel={tcommon("optional")}
        autoComplete={`${prefix === "billing" ? "billing" : "shipping"} ${AUTOCOMPLETE.line2}`}
        error={err(`${prefix}.line2`)}
        className="col-span-2"
        {...register(`${prefix}.line2` as "shipping.line2")}
      />
      <Input
        id={fieldId(`${prefix}.city`)}
        label={t("city")}
        autoComplete={`${prefix === "billing" ? "billing" : "shipping"} ${AUTOCOMPLETE.city}`}
        error={err(`${prefix}.city`)}
        {...register(`${prefix}.city` as "shipping.city")}
      />
      <Input
        id={fieldId(`${prefix}.postalCode`)}
        label={t("postalCode")}
        optionalLabel={tcommon("optional")}
        autoComplete={`${prefix === "billing" ? "billing" : "shipping"} ${AUTOCOMPLETE.postalCode}`}
        error={err(`${prefix}.postalCode`)}
        {...register(`${prefix}.postalCode` as "shipping.postalCode")}
      />
      <Input
        id={fieldId(`${prefix}.region`)}
        label={t("region")}
        optionalLabel={tcommon("optional")}
        autoComplete={`${prefix === "billing" ? "billing" : "shipping"} ${AUTOCOMPLETE.region}`}
        error={err(`${prefix}.region`)}
        className="col-span-2"
        {...register(`${prefix}.region` as "shipping.region")}
      />
    </div>
  );

  const sectionTitle = "font-serif text-[1.5rem] font-normal leading-tight";
  const isCard = method === "paysera";

  return (
    <div className="overflow-x-clip">
      <div className="lg:container-page lg:grid lg:grid-cols-12 lg:gap-6">
        {/* Mobile summary bar */}
        <div className="border-b border-hairline bg-linen lg:hidden">
          <button
            type="button"
            onClick={() => setSummaryOpen((v) => !v)}
            aria-expanded={summaryOpen}
            aria-controls={summaryId}
            className="container-page flex min-h-14 w-full items-center justify-between gap-4 text-small"
          >
            <span className="flex items-center gap-2">
              {summaryOpen ? t("hideSummary") : t("showSummary")}
              <ChevronDown
                aria-hidden
                size={16}
                strokeWidth={1.25}
                className={cn(
                  "transition-transform duration-(--duration-ui)",
                  summaryOpen && "rotate-180",
                )}
              />
            </span>
            <span className="nums font-serif text-[1.25rem]">
              {formatPrice(totals.totalCents, locale)}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {summaryOpen && (
              <motion.div
                id={summaryId}
                key="summary"
                initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                animate={
                  reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }
                }
                exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                transition={{ duration: duration.ui, ease: ease.couture }}
                className="overflow-hidden"
              >
                <div className="container-page pb-8 pt-2">{summary}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form */}
        <div className="container-page py-10 lg:col-span-7 lg:px-0 lg:py-16 lg:pr-10">
          <h1 className="font-serif text-h2 font-light">{t("title")}</h1>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8">
            {formError && (
              <div
                role="alert"
                className="mb-8 border border-error px-5 py-4 text-small text-error"
              >
                {formError}
              </div>
            )}
            <ErrorSummary errors={summaryErrors} submitCount={submitCount} />

            <section
              aria-labelledby="checkout-contact"
              className="flex flex-col gap-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 id="checkout-contact" className={sectionTitle}>
                  {t("contact")}
                </h2>
                {account ? (
                  <p className="text-small text-stone">{t("signedInAs", { email: account.email })}</p>
                ) : (
                  <p className="text-small text-stone">
                    {t.rich("signInPrompt", {
                      link: (chunks) => (
                        <a href={signInHref} className="link-underline text-ink">
                          {chunks}
                        </a>
                      ),
                    })}
                  </p>
                )}
              </div>
              <Input
                id={fieldId("email")}
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                label={t("email")}
                hint={t("emailHint")}
                error={err("email")}
                {...register("email")}
              />
              <fieldset>
                <legend className="sr-only">{t("phone")}</legend>
                <div className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] gap-3">
                  <Controller
                    control={control}
                    name="phoneCountry"
                    render={({ field }) => (
                      <Select
                        id={fieldId("phoneCountry")}
                        label={t("phoneCountry")}
                        options={callingOptions}
                        autoComplete="tel-country-code"
                        {...field}
                      />
                    )}
                  />
                  <Input
                    id={fieldId("phone")}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    label={t("phone")}
                    error={err("phone")}
                    {...register("phone")}
                  />
                </div>
                <p className="mt-2 text-small text-stone">{t("phoneHint")}</p>
              </fieldset>
              <Checkbox label={t("marketing")} {...register("marketing")} />
            </section>

            <section
              aria-labelledby="checkout-delivery"
              className="mt-10 border-t border-hairline pt-10"
            >
              <h2 id="checkout-delivery" className={cn(sectionTitle, "mb-6")}>
                {t("delivery")}
              </h2>
              {savedAddresses.length > 0 && (
                <Select
                  id="checkout-saved-address"
                  label={t("savedAddress")}
                  className="mb-6"
                  value={addressChoice}
                  onChange={(e) => {
                    const choice = e.target.value;
                    setAddressChoice(choice);
                    const a = savedAddresses.find((x) => x.id === choice) ?? null;
                    const next = addressValues(a, getValues("shipping.country"));
                    for (const [key, value] of Object.entries(next)) {
                      setValue(`shipping.${key as keyof typeof next}`, value, { shouldValidate: Boolean(a) });
                    }
                    if (a?.phone && !getValues("phone")) setValue("phone", a.phone);
                  }}
                  options={[
                    ...savedAddresses.map((a) => ({ value: a.id, label: `${a.firstName} ${a.lastName}, ${a.line1}, ${a.city}` })),
                    { value: "new", label: t("newAddress") },
                  ]}
                />
              )}
              {addressFields("shipping")}
              {account && addressChoice === "new" && (
                <Checkbox
                  className="mt-4"
                  label={t("saveAddress")}
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                />
              )}
            </section>

            <section
              aria-labelledby="checkout-shipping"
              className="mt-10 border-t border-hairline pt-10"
            >
              <h2 id="checkout-shipping" className={cn(sectionTitle, "mb-6")}>
                {t("shipping")}
              </h2>
              <div
                id={fieldId("shippingRateId")}
                tabIndex={-1}
                className="outline-none"
              >
                {zone && zone.rates.length > 0 ? (
                  <Controller
                    control={control}
                    name="shippingRateId"
                    render={({ field }) => (
                      <RadioGroup
                        name="shippingRateId"
                        legend={t("shipping")}
                        hideLegend
                        variant="card"
                        value={field.value}
                        onValueChange={field.onChange}
                        error={err("shippingRateId")}
                        options={zone.rates.map((r) => {
                          const price = shippingAmount(
                            r,
                            subtotalCents - computed.discountCents,
                          );
                          return {
                            value: r.id,
                            label: pick(r.name, locale),
                            description: t("shippingDays", {
                              min: r.minDays,
                              max: r.maxDays,
                            }),
                            aside: (
                              <span className="nums">
                                {price === 0
                                  ? t("shippingFree")
                                  : formatPrice(price, locale)}
                              </span>
                            ),
                          };
                        })}
                      />
                    )}
                  />
                ) : (
                  <p className="border border-hairline bg-linen p-5 text-small">
                    {t("shippingNone")}
                  </p>
                )}
              </div>
              {madeToOrder && (
                <p className="mt-4 text-small text-stone">
                  {t("madeToOrderNote")}
                </p>
              )}
            </section>

            <section
              aria-labelledby="checkout-payment"
              className="mt-10 border-t border-hairline pt-10"
            >
              <h2 id="checkout-payment" className={cn(sectionTitle, "mb-6")}>
                {t("payment")}
              </h2>
              <div
                id={fieldId("paymentMethod")}
                tabIndex={-1}
                className="outline-none"
              >
                <Controller
                  control={control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <RadioGroup
                      name="paymentMethod"
                      legend={t("payment")}
                      hideLegend
                      variant="card"
                      value={field.value}
                      onValueChange={field.onChange}
                      error={err("paymentMethod")}
                      options={methods.map((m) => ({
                        value: m.id,
                        label: t(`methods.${m.id}.label`),
                        description: t(`methods.${m.id}.description`),
                        aside: (
                          <span className="text-ink/70">
                            {METHOD_ICONS[m.id]}
                          </span>
                        ),
                        content: (
                          <p className="text-stone">
                            {t(`methods.${m.id}.content`)}
                          </p>
                        ),
                      }))}
                    />
                  )}
                />
              </div>
            </section>

            <section
              aria-labelledby="checkout-billing"
              className="mt-10 border-t border-hairline pt-10"
            >
              <h2 id="checkout-billing" className={cn(sectionTitle, "mb-6")}>
                {t("billing")}
              </h2>
              <Controller
                control={control}
                name="billingSame"
                render={({ field }) => (
                  <RadioGroup
                    name="billingSame"
                    legend={t("billing")}
                    hideLegend
                    variant="card"
                    value={field.value ? "same" : "different"}
                    onValueChange={(v) => {
                      field.onChange(v === "same");
                      if (v === "different" && !getValues("billing")) {
                        setValue("billing", {
                          firstName: "",
                          lastName: "",
                          line1: "",
                          line2: "",
                          city: "",
                          postalCode: "",
                          region: "",
                          country,
                        });
                      }
                    }}
                    options={[
                      { value: "same", label: t("billingSame") },
                      { value: "different", label: t("billingDifferent") },
                    ]}
                  />
                )}
              />
              {!billingSame && (
                <div className="mt-6">{addressFields("billing")}</div>
              )}
            </section>

            <section className="mt-10 border-t border-hairline pt-10">
              <Textarea
                id={fieldId("note")}
                label={t("note")}
                optionalLabel={tcommon("optional")}
                hint={t("noteHint")}
                error={err("note")}
                rows={3}
                maxLength={1000}
                {...register("note")}
              />
            </section>

            <div className="mt-10 border-t border-hairline pt-8">
              <TotalsTable
                totals={totals}
                discountCode={discount?.code}
                className="mb-8 lg:hidden"
              />
              <Checkbox
                id={fieldId("terms")}
                error={err("terms")}
                label={t.rich("terms", {
                  terms: (chunks) => (
                    <Link
                      href="/terms"
                      target="_blank"
                      className="link-underline"
                    >
                      {chunks}
                    </Link>
                  ),
                  privacy: (chunks) => (
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="link-underline"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
                {...register("terms")}
              />
              <Button
                type="submit"
                loading={placing || leaving}
                className="mt-6 w-full"
              >
                {placing || leaving
                  ? t("processing")
                  : isCard
                    ? t("payNow")
                    : t("placeOrder")}
              </Button>
            </div>
          </form>
        </div>

        {/* Desktop summary */}
        <aside
          aria-labelledby="checkout-summary"
          className="relative hidden bg-linen before:absolute before:inset-y-0 before:left-full before:w-[50vw] before:bg-linen lg:col-span-5 lg:col-start-8 lg:block"
        >
          <div
            className="sticky top-0 max-h-dvh overflow-y-auto px-10 py-16"
            data-lenis-prevent
          >
            <h2 id="checkout-summary" className="mb-8 font-serif text-[1.5rem]">
              {t("summary")}
            </h2>
            {summary}
          </div>
        </aside>
      </div>
    </div>
  );
}
