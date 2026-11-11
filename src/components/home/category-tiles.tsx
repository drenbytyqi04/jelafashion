import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CatalogCategory, Locale } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { getCatalog } from "@/lib/catalog/repository";
import { cn } from "@/lib/cn";
import { categoryNav } from "@/lib/nav";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { siteImages } from "@/lib/site-images";

const TINTS = { bridal: "#F4EDE1", evening: "#5C534C", short: "#EBD3CB" } as const;
const PHOTOS = { bridal: siteImages.categoryBridal, evening: siteImages.categoryEvening, short: siteImages.categoryShort } as const;

export async function CategoryTiles({ categories, locale }: { categories: CatalogCategory[]; locale: Locale }) {
  const t = await getTranslations("homeSections");
  // A category with no published dress is left out rather than linking to an empty page.
  const catalog = await getCatalog();
  const tiles = categoryNav.filter((c) => catalog.some((p) => p.category === c.key));
  const pair = tiles.length === 2;
  return (
    <section aria-labelledby="categories-title" className="pb-24 pt-16 lg:pb-40 lg:pt-32">
      <h2 id="categories-title" className="sr-only">
        {t("categoriesTitle")}
      </h2>
      {/* Three: on mobile bridal leads full width with the other two paired below, so all
          are seen without swiping; on desktop three columns, the middle one dropped. Two:
          a pair side by side, offset on desktop like an editorial spread. */}
      <ul className={cn("container-page grid grid-cols-2 gap-x-3 gap-y-10 lg:gap-6", pair ? "lg:grid-cols-12" : "lg:grid-cols-3")}>
        {tiles.map((c, i) => {
          const category = categories.find((x) => x.id === c.key);
          const lead = i === 0 && !pair;
          return (
            <li
              key={c.key}
              className={cn(
                lead && "col-span-2 lg:col-span-1",
                pair && (i === 0 ? "lg:col-span-5 lg:col-start-2" : "lg:col-span-5 lg:col-start-7"),
                i === 1 && "lg:mt-24",
              )}
            >
              <Link href={c.href} className="group block">
                <div className="overflow-hidden">
                  <div className="transition-transform duration-[1200ms] ease-(--ease-couture) group-hover:scale-[1.04] motion-reduce:transition-none">
                    <ImagePlaceholder
                      ratio="3/4"
                      className={cn(lead && "aspect-[4/5] lg:aspect-[3/4]")}
                      tint={TINTS[c.key]}
                      src={PHOTOS[c.key]}
                      sizes={lead ? "(min-width: 1024px) 33vw, 100vw" : pair ? "(min-width: 1024px) 40vw, 50vw" : "(min-width: 1024px) 33vw, 50vw"}
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
