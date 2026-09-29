import { Video } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { whatsappHref } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/brand-icons";

export async function Consultation() {
  const t = await getTranslations("homeSections");
  const wa = whatsappHref(t("consultTitle"));
  return (
    <section aria-labelledby="consult-title" className="section bg-blush">
      <div className="container-page lg:grid lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-6 lg:col-start-2">
          <h2 id="consult-title" className="font-serif text-h2">
            {t("consultTitle")}
          </h2>
          <p className="measure mt-5 text-body text-ink/80">{t("consultText")}</p>
        </div>
        <div className="mt-10 flex flex-col gap-3 lg:col-span-4 lg:col-start-8 lg:mt-0 lg:justify-center">
          <Button asChild block className="lg:w-full">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener">
                <WhatsAppIcon size={18} />
                {t("consultWhatsapp")}
              </a>
            ) : (
              <Link href="/contact">
                <WhatsAppIcon size={18} />
                {t("consultWhatsapp")}
              </Link>
            )}
          </Button>
          <Button asChild variant="secondary" block className="lg:w-full">
            <Link href={{ pathname: "/contact", query: { topic: "video" } }}>
              <Video aria-hidden size={18} strokeWidth={1.25} />
              {t("consultVideo")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
