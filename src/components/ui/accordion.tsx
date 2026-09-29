"use client";

import { Plus } from "lucide-react";
import { Accordion as Primitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AccordionItem = { value: string; title: ReactNode; content: ReactNode };

export function Accordion({
  items,
  type = "single",
  defaultValue,
  headingLevel = 3,
  className,
}: {
  items: AccordionItem[];
  type?: "single" | "multiple";
  defaultValue?: string;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}) {
  const Heading = `h${headingLevel}` as const;
  const rootProps =
    type === "single"
      ? ({ type: "single", collapsible: true, defaultValue } as const)
      : ({ type: "multiple", defaultValue: defaultValue ? [defaultValue] : undefined } as const);

  return (
    <Primitive.Root {...rootProps} className={cn("border-t border-hairline", className)}>
      {items.map((item) => (
        <Primitive.Item key={item.value} value={item.value} className="border-b border-hairline">
          <Primitive.Header asChild>
            <Heading className="font-sans">
              <Primitive.Trigger className="group flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left">
                <span className="label">{item.title}</span>
                <Plus
                  aria-hidden
                  size={18}
                  strokeWidth={1.25}
                  className="shrink-0 transition-transform duration-(--duration-ui) ease-(--ease-couture) group-data-[state=open]:rotate-45"
                />
              </Primitive.Trigger>
            </Heading>
          </Primitive.Header>
          <Primitive.Content className="accordion-content overflow-hidden">
            <div className="measure pb-6 text-body text-ink">{item.content}</div>
          </Primitive.Content>
        </Primitive.Item>
      ))}
    </Primitive.Root>
  );
}
