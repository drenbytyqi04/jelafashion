import { z } from "zod";

// Messages are translation keys under `forms`, resolved on the client.
export const newsletterSchema = z.object({
  email: z.string().trim().min(1, "required").email("email").max(254, "email"),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
