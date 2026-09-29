import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the design-system type scale and colours; otherwise it treats
// `text-small` and `text-ink` as the same group and drops one of them.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "ivory",
        "linen",
        "blush",
        "ink",
        "stone",
        "champagne",
        "champagne-deep",
        "gold-ink",
        "hairline",
        "field",
        "error",
        "success",
        "white",
      ],
      text: ["display", "h1", "h2", "h3", "lead", "body", "small", "label", "wordmark", "price"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
