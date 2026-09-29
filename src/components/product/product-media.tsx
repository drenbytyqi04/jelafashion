import Image from "next/image";
import type { CatalogProduct, Locale } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";

/** Product photo at `index`, or a tinted placeholder until photos are uploaded. */
export function ProductMedia({
  product,
  locale,
  index = 0,
  sizes,
  priority,
  className,
}: {
  product: CatalogProduct;
  locale: Locale;
  index?: number;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const image = product.images[index];
  if (image) {
    return (
      <div className={cn("relative aspect-[3/4] w-full overflow-hidden bg-linen", className)}>
        <Image
          src={image.url}
          alt={index === 0 ? pick(image.alt, locale) || pick(product.name, locale) : ""}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }
  const color = product.colors[index % Math.max(product.colors.length, 1)]?.hex;
  return <ImagePlaceholder ratio="3/4" tint={color} pose={index === 0 ? "front" : "back"} className={className} />;
}
