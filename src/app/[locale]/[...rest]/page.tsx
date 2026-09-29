import { notFound } from "next/navigation";

// Unknown paths under a locale render the localized not-found page.
export const dynamic = "force-static";

export default function CatchAll() {
  notFound();
}
