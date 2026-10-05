import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

type Ratio = "3/4" | "4/5" | "9/16" | "16/9" | "1/1";
type Tone = "linen" | "blush" | "stone";

const ratios: Record<Ratio, string> = {
  "3/4": "aspect-[3/4]",
  "4/5": "aspect-[4/5]",
  "9/16": "aspect-[9/16]",
  "16/9": "aspect-video",
  "1/1": "aspect-square",
};

const tones: Record<Tone, string> = {
  linen: "bg-linen",
  blush: "bg-blush",
  stone: "bg-[#d9d0c4]",
};

/**
 * Neutral stand-in for photography until real images are uploaded in the admin panel.
 * A faint croquis silhouette keeps it reading as fashion rather than a grey box.
 */
export function ImagePlaceholder({
  ratio = "3/4",
  tone = "linen",
  className,
  decorative = true,
  tint,
  pose = "front",
  src,
  alt = "",
  sizes = "100vw",
  priority,
  position = "center",
}: {
  ratio?: Ratio;
  tone?: Tone;
  className?: string;
  decorative?: boolean;
  /** Garment colour: tints the frame so sample products read as different dresses. */
  tint?: string;
  /** Alternate silhouette for a second (hover) image. */
  pose?: "front" | "back";
  /** A photo for this slot: shown instead of the croquis, cropped to the same frame. */
  src?: string | null;
  /** Empty (the default) marks the photo decorative. */
  alt?: string;
  sizes?: string;
  priority?: boolean;
  /** object-position for the crop, e.g. "top" to keep a face in a tall frame. */
  position?: "center" | "top";
}) {
  const t = useTranslations("placeholder");
  if (src) {
    return (
      <div className={cn("relative w-full overflow-hidden bg-linen", ratios[ratio], className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", position === "top" ? "object-top" : "object-center")}
        />
      </div>
    );
  }
  return (
    <div
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : t("image")}
      aria-hidden={decorative || undefined}
      className={cn("relative w-full overflow-hidden", ratios[ratio], !tint && tones[tone], className)}
      style={tint ? { background: `color-mix(in srgb, ${tint} 38%, #F2ECE3)` } : undefined}
    >
      <svg
        viewBox="0 0 120 240"
        preserveAspectRatio="xMidYMax meet"
        className="absolute inset-x-0 bottom-0 mx-auto h-[82%] w-auto text-ink/10"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
      >
        <circle cx="60" cy="22" r="9" />
        {pose === "front" ? (
          <path d="M60 31v8M50 44c3-3 17-3 20 0M47 46l-9 44M73 46l9 44M50 44c2 16 3 26 1 38M70 44c-2 16-3 26-1 38M51 82c10 3 8 3 18 0M51 82L26 238M69 82l25 156M26 238h68" />
        ) : (
          <path d="M60 31v8M50 44c3-3 17-3 20 0M47 46l-7 42M73 46l7 42M50 44c1 12 2 22 1 38M70 44c-1 12-2 22-1 38M60 44v38M51 82c10 2 8 2 18 0M51 82L34 238M69 82l17 156M34 238h52" />
        )}
      </svg>
    </div>
  );
}
