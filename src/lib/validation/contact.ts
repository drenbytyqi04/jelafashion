import { z } from "zod";

export const CONTACT_TOPICS = ["general", "sizing", "order", "video"] as const;

// Messages are translation keys: `required`/`email` under `forms`, `tooLong` under `checkout.errors`.
export const contactSchema = z.object({
  name: z.string().trim().min(1, "required").max(120, "tooLong"),
  email: z.string().trim().min(1, "required").email("email").max(254, "email"),
  phone: z.string().trim().max(30, "tooLong"),
  topic: z.enum(CONTACT_TOPICS),
  orderNumber: z.string().trim().max(20, "tooLong"),
  message: z.string().trim().min(1, "required").max(3000, "tooLong"),
  dress: z.string().max(80).optional(),
  /** Honeypot: people never see or fill it. */
  website: z.string().max(0).optional(),
});

export type ContactInput = z.input<typeof contactSchema>;
