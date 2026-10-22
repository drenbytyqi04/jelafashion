import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CatalogCategory, Locale } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { categoryNav } from "@/lib/nav";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { siteImages } from "@/lib/site-images";

const TINTS = { bridal: "#F4EDE1", evening: "#5C534C", short: "#EBD3CB" } as const;
const PHOTOS = { bridal: siteImages.categoryBridal, evening: siteImages.categoryEvening, short: siteImages.categoryShort } as const;

export async function CategoryTiles({ categories, locale }: { categories: CatalogCategory[]; locale: Locale }) {
  const t = await getTranslations("homeSections");
  return (
    <section aria-labelledby="categories-title" className="pb-24 pt-16 lg:pb-40 lg:pt-32">
      <h2 id="categories-title" className="sr-only">
        {t("categoriesTitle")}
      </h2>
      {/* Mobile: bridal leads full width, evening and short pair below, so all three are
          seen without swiping. Desktop: three columns, the middle one dropped. */}
      <ul className="container-page grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-3 lg:gap-6">
        {categoryNav.map((c, i) => {
          const category = categories.find((x) => x.id === c.key);
          return (
            <li key={c.key} className={cn(i === 0 && "col-span-2 lg:col-span-1", i === 1 && "lg:mt-24")}>
              <Link href={c.href} className="group block">
                <div className="overflow-hidden">
                  <div className="transition-transform duration-[1200ms] ease-(--ease-couture) group-hover:scale-[1.04] motion-reduce:transition-none">
                    <ImagePlaceholder
                      ratio="3/4"
                      className={cn(i === 0 && "aspect-[4/5] lg:aspect-[3/4]")}
                      tint={TINTS[c.key]}
                      src={PHOTOS[c.key]}
                      sizes={i === 0 ? "(min-width: 1024px) 33vw, 100vw" : "(min-width: 1024px) 33vw, 50vw"}
                      position="top"
                    />
                  </div>
                </div>
                <span className="label relative mt-4 inline-block pb-2 lg:mt-5">
                  {category ? pick(category.name, locale) : c.key}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-champagne transition-transform duration-(--duration-ui) ease-(--ease-couture) group-hover:scale-x-100 group-focus-visible:scale-x-100"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
