import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js/min";
import { z } from "zod";
import { PAYMENT_METHOD_IDS } from "@/lib/commerce/types";

// Shared by the checkout form (inline errors) and the placeOrder action (the check that
// counts). Messages are translation keys: `required`/`email` under `forms`, the rest under
// `checkout.errors`.

const text = (max: number) => z.string().trim().min(1, "required").max(max, "tooLong");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .optional()
    .transform((v) => v || undefined);

const country = z.string().regex(/^[A-Z]{2}$/, "country");

export const addressSchema = z.object({
  firstName: text(80),
  lastName: text(80),
  line1: text(160),
  line2: optionalText(160),
  city: text(80),
  postalCode: optionalText(20),
  region: optionalText(80),
  country,
});

export const checkoutSchema = z
  .object({
    email: z.string().trim().min(1, "required").email("email").max(254, "email"),
    phoneCountry: country,
    phone: z.string().trim().min(1, "required").max(30, "phone"),
    marketing: z.boolean(),
    shipping: addressSchema,
    shippingRateId: z.string({ error: "shippingRate" }).min(1, "shippingRate"),
    paymentMethod: z.enum(PAYMENT_METHOD_IDS, { error: "paymentMethod" }),
    billingSame: z.boolean(),
    // Validated below only when a separate billing address is used.
    billing: z.unknown().optional(),
    note: optionalText(1000),
    discountCode: optionalText(32),
    terms: z.boolean().refine((v) => v, "terms"),
  })
  .superRefine((v, ctx) => {
    if (v.phone && !isValidPhoneNumber(v.phone, v.phoneCountry as CountryCode)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "phone" });
    }
    if (!v.billingSame) {
      const billing = addressSchema.safeParse(v.billing ?? {});
      if (!billing.success) {
        for (const issue of billing.error.issues) {
          ctx.addIssue({ code: "custom", path: ["billing", ...issue.path], message: issue.message });
        }
      }
    }
  });

export type CheckoutFormValues = z.input<typeof checkoutSchema>;
export type CheckoutValues = z.output<typeof checkoutSchema>;

/** Cart lines as the browser holds them; every value is re-checked against the catalog. */
export const cartLinesSchema = z
  .array(
    z.object({
      key: z.string().max(200),
      productId: z.string().max(64),
      slug: z.string().max(80),
      priceEUR: z.number().nonnegative(),
      quantity: z.number().int().min(1).max(10),
      size: z.string().max(10),
      colorHex: z.string().max(16).optional(),
      measurements: z
        .array(z.object({ id: z.string().max(40), cm: z.number().nonnegative().max(400) }))
        .max(30)
        .optional(),
      unit: z.enum(["cm", "in"]).optional(),
      notes: z.string().max(1000).optional(),
    }),
  )
  .min(1)
  .max(20);

export type CartLinesInput = z.infer<typeof cartLinesSchema>;
