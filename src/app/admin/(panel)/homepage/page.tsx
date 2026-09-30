import { requireAdmin } from "@/lib/auth/viewer";
import { catalogAdminStore } from "@/lib/admin/catalog-store";
import { localCatalog, localMediaUrl } from "@/lib/local-db";
import { storagePublicUrl } from "@/lib/supabase/public-client";
import { HomepageEditor } from "@/components/admin/homepage-editor";
import { Unavailable } from "@/components/admin/shared";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Faqja kryesore" };

export default async function AdminHomepage() {
  await requireAdmin();
  const store = catalogAdminStore();
  if (!store) return <Unavailable />;
  const [hero, marquee, testimonials] = await Promise.all([store.hero(), store.marquee(), store.testimonials()]);
  const url = (p: string | null) => (localCatalog() ? localMediaUrl("site-media", p) : storagePublicUrl("site-media", p));
  return (
    <>
      <PageHeader title="Faqja kryesore" description="Ndryshimet shfaqen në faqe menjëherë pas ruajtjes." />
      <HomepageEditor hero={hero} marquee={marquee} media={{ video: url(hero.videoPath), poster: url(hero.posterPath) }} testimonials={testimonials} />
    </>
  );
}
