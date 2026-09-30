"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { deleteTestimonial, saveHomepage, saveTestimonial } from "@/app/actions/admin-catalog";
import type { AdminTestimonial, HeroSettings, MarqueeSettings } from "@/lib/catalog/admin-types";
import { toast } from "@/stores/toast";
import { Drawer } from "@/components/ui/drawer";
import { Btn, Field, Panel, TextArea, TextInput, Toggle } from "./ui";
import { uploadAdminMedia } from "./upload";

type HomeValues = { headSq: string; headEn: string; subSq: string; subEn: string; marqueeSq: string; marqueeEn: string };
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

function MediaSlot({
  label,
  hint,
  accept,
  url,
  kind,
  onUploaded,
  onClear,
}: {
  label: string;
  hint: string;
  accept: string;
  url: string | null;
  kind: "video" | "image";
  onUploaded: (m: { path: string; url: string }) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-admin border border-hairline p-3">
      <p className="text-[0.8125rem] font-medium">{label}</p>
      <p className="text-[0.75rem] text-stone">{hint}</p>
      {url &&
        (kind === "video" ? (
          <video src={url} muted playsInline controls className="mt-3 aspect-video w-full rounded-[2px] bg-ink object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="mt-3 aspect-video w-full rounded-[2px] object-cover" />
        ))}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        aria-label={label}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            onUploaded(await uploadAdminMedia(file, "site-media", "hero"));
          } catch (err) {
            toast({ title: err instanceof Error ? err.message : "Ngarkimi dështoi.", tone: "error" });
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <div className="mt-3 flex gap-2">
        <Btn size="sm" loading={busy} onClick={() => ref.current?.click()}>
          {url ? "Zëvendëso" : "Ngarko"}
        </Btn>
        {url && (
          <Btn size="sm" variant="ghost" onClick={onClear}>
            Hiq
          </Btn>
        )}
      </div>
    </div>
  );
}

export function HomepageEditor({
  hero,
  marquee,
  media,
  testimonials,
}: {
  hero: HeroSettings;
  marquee: MarqueeSettings;
  media: { video: string | null; poster: string | null };
  testimonials: AdminTestimonial[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [video, setVideo] = useState<{ path: string | null; url: string | null }>({ path: hero.videoPath, url: media.video });
  const [poster, setPoster] = useState<{ path: string | null; url: string | null }>({ path: hero.posterPath, url: media.poster });
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<HomeValues>({
    defaultValues: {
      headSq: hero.headline.sq.join("\n"),
      headEn: hero.headline.en.join("\n"),
      subSq: hero.subtitle.sq,
      subEn: hero.subtitle.en,
      marqueeSq: marquee.sq.join("\n"),
      marqueeEn: marquee.en.join("\n"),
    },
  });

  const onSubmit = (v: HomeValues) =>
    startTransition(async () => {
      setError(null);
      const res = await saveHomepage({
        hero: { videoPath: video.path, posterPath: poster.path, headline: { sq: lines(v.headSq), en: lines(v.headEn) }, subtitle: { sq: v.subSq, en: v.subEn } },
        marquee: { sq: lines(v.marqueeSq), en: lines(v.marqueeEn) },
      });
      if (!res.ok) return setError(res.error);
      toast({ title: "Faqja kryesore u përditësua.", tone: "success" });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {error && (
          <p role="alert" className="rounded-admin border border-error/60 bg-white px-4 py-3 text-error">
            {error}
          </p>
        )}
        <Panel title="Hyrja (hero)">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titulli (shqip)" htmlFor="hsq" hint="Një rresht për çdo rresht të titullit, deri në 3.">
              <TextArea id="hsq" rows={3} {...register("headSq")} />
            </Field>
            <Field label="Titulli (anglisht)" htmlFor="hen">
              <TextArea id="hen" rows={3} {...register("headEn")} />
            </Field>
            <Field label="Nëntitulli (shqip)" htmlFor="ssq">
              <TextArea id="ssq" {...register("subSq")} />
            </Field>
            <Field label="Nëntitulli (anglisht)" htmlFor="sen">
              <TextArea id="sen" {...register("subEn")} />
            </Field>
            <MediaSlot
              label="Video"
              hint="MP4 ose WebM, deri në 50 MB. E heshtur, 10–20 sekonda, në cikël."
              accept="video/mp4,video/webm"
              kind="video"
              url={video.url}
              onUploaded={(m) => setVideo(m)}
              onClear={() => setVideo({ path: null, url: null })}
            />
            <MediaSlot
              label="Foto e parë (poster)"
              hint="Shfaqet derisa ngarkohet videoja dhe kur lëvizja është e fikur."
              accept="image/jpeg,image/png,image/webp,image/avif"
              kind="image"
              url={poster.url}
              onUploaded={(m) => setPoster(m)}
              onClear={() => setPoster({ path: null, url: null })}
            />
          </div>
        </Panel>
        <Panel title="Shiriti lëvizës">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Frazat (shqip)" htmlFor="msq" hint="Një frazë për rresht.">
              <TextArea id="msq" rows={4} {...register("marqueeSq")} />
            </Field>
            <Field label="Frazat (anglisht)" htmlFor="men">
              <TextArea id="men" rows={4} {...register("marqueeEn")} />
            </Field>
          </div>
        </Panel>
        <div>
          <Btn variant="primary" type="submit" loading={pending}>
            Ruaj faqen kryesore
          </Btn>
        </div>
      </form>
      <TestimonialsEditor testimonials={testimonials} />
    </div>
  );
}

type TValues = { quoteSq: string; quoteEn: string; author: string; location: string; published: boolean; sort: string };

function TestimonialsEditor({ testimonials }: { testimonials: AdminTestimonial[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminTestimonial | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, reset } = useForm<TValues>();
  const current = editing && editing !== "new" ? editing : null;

  const open = (t: AdminTestimonial | "new") => {
    setError(null);
    const x = t === "new" ? null : t;
    reset({ quoteSq: x?.quote.sq ?? "", quoteEn: x?.quote.en ?? "", author: x?.author ?? "", location: x?.location ?? "", published: x?.published ?? true, sort: String(x?.sort ?? testimonials.length + 1) });
    setEditing(t);
  };

  const onSubmit = (v: TValues) =>
    startTransition(async () => {
      const res = await saveTestimonial({ id: current?.id, quote: { sq: v.quoteSq, en: v.quoteEn || v.quoteSq }, author: v.author, location: v.location.trim() || null, published: v.published, sort: Number(v.sort) || 0 });
      if (!res.ok) return setError(res.error);
      setEditing(null);
      router.refresh();
    });

  const onDelete = () =>
    startTransition(async () => {
      if (!current) return;
      const res = await deleteTestimonial(current.id);
      if (!res.ok) return setError(res.error);
      setEditing(null);
      router.refresh();
    });

  return (
    <Panel title="Fjalët e nuseve" actions={<Btn size="sm" onClick={() => open("new")}>Shto</Btn>}>
      <p className="mb-3 text-[0.8125rem] text-stone">Vetëm fjalë të vërteta, me lejen e klientes. Vendet [REVIEW TEXT] zëvendësohen këtu.</p>
      <ul className="flex flex-col divide-y divide-hairline">
        {testimonials.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => open(t)} className="flex w-full items-start justify-between gap-4 py-3 text-left hover:bg-linen/60">
              <span>
                <span className="block">“{t.quote.sq}”</span>
                <span className="text-[0.75rem] text-stone">
                  {t.author}
                  {t.location ? `, ${t.location}` : ""}
                </span>
              </span>
              <span className={t.published ? "text-[0.75rem] text-success" : "text-[0.75rem] text-stone"}>{t.published ? "Publikuar" : "Draft"}</span>
            </button>
          </li>
        ))}
      </ul>
      <Drawer
        open={editing !== null}
        onOpenChange={(v) => !v && setEditing(null)}
        title={current ? "Ndrysho" : "Fjalë të reja"}
        footer={
          <div className="flex justify-between gap-2">
            {current ? (
              <Btn variant="danger" onClick={onDelete} loading={pending}>
                Fshij
              </Btn>
            ) : (
              <span />
            )}
            <Btn variant="primary" type="submit" form="testimonial-form" loading={pending}>
              Ruaj
            </Btn>
          </div>
        }
      >
        <form id="testimonial-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-[0.875rem]">
          {error && (
            <p role="alert" className="rounded-admin border border-error/60 px-3 py-2 text-error">
              {error}
            </p>
          )}
          <Field label="Fjalët (shqip)" htmlFor="tq">
            <TextArea id="tq" rows={4} {...register("quoteSq")} />
          </Field>
          <Field label="Fjalët (anglisht)" htmlFor="tqe">
            <TextArea id="tqe" rows={4} {...register("quoteEn")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Emri" htmlFor="ta">
              <TextInput id="ta" {...register("author")} />
            </Field>
            <Field label="Qyteti" htmlFor="tl">
              <TextInput id="tl" {...register("location")} />
            </Field>
          </div>
          <div className="flex items-end gap-4">
            <Field label="Renditja" htmlFor="ts" className="w-24">
              <TextInput id="ts" inputMode="numeric" {...register("sort")} />
            </Field>
            <Toggle label="Publikuar" {...register("published")} />
          </div>
        </form>
      </Drawer>
    </Panel>
  );
}
