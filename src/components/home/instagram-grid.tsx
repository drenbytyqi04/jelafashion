import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site";
import { InstagramIcon } from "@/components/icons/brand-icons";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { siteImages } from "@/lib/site-images";

const TILES = ["#F4EDE1", "#D9C3A0", "#EBD3CB", "#5C534C", "#E6DCCD", "#C9A3A0"];

// Static placeholders linking to the profile until an Instagram feed is connected.
export async function InstagramGrid() {
  const t = await getTranslations("homeSections");
  return (
    <section aria-labelledby="instagram-title" className="section">
      <div className="container-page">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 id="instagram-title" className="font-serif text-h2">
            {t("instagramTitle")}
          </h2>
          <a href={site.instagramUrl} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-2 text-small">
            <InstagramIcon size={18} />
            <span className="link-underline">{t("instagramCta")}</span>
          </a>
        </div>
        <ul className="grid grid-cols-3 gap-1.5 lg:grid-cols-6 lg:gap-3">
          {TILES.map((tint, i) => (
            <li key={i}>
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noopener"
                aria-label={t("instagramPost", { n: i + 1 })}
                className="group block overflow-hidden"
              >
                <div className="transition-transform duration-[1200ms] ease-(--ease-couture) group-hover:scale-[1.04] motion-reduce:transition-none">
                  <ImagePlaceholder ratio="1/1" tint={tint} pose={i % 2 ? "back" : "front"} src={siteImages.instagram[i]} sizes="(min-width: 1024px) 17vw, 50vw" />
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
