import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ProseSection = { title: string; body: string[] };

/** Numbered-free text sections on the editorial grid: heading left, text right on desktop. */
export function ProseSections({ sections, footer, className }: { sections: ProseSection[]; footer?: ReactNode; className?: string }) {
  return (
    <div className={cn("container-page", className)}>
      {sections.map((s) => (
        <section key={s.title} className="grid gap-4 border-b border-hairline py-12 lg:grid-cols-12 lg:gap-6 lg:py-16">
          <h2 className="font-serif text-h3 lg:col-span-4">{s.title}</h2>
          <div className="flex flex-col gap-4 lg:col-span-7 lg:col-start-6">
            {s.body.map((p, i) => (
              <p key={i} className="measure text-body text-ink/85">
                {p}
              </p>
            ))}
          </div>
        </section>
      ))}
      {footer && <div className="py-12 lg:py-16">{footer}</div>}
    </div>
  );
}
