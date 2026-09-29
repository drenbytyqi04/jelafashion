"use client";

import { useState, type ReactNode } from "react";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer } from "@/components/ui/drawer";
import { ErrorSummary } from "@/components/ui/error-summary";
import { FileUpload } from "@/components/ui/file-upload";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Marquee } from "@/components/motion/marquee";
import { Parallax } from "@/components/motion/parallax";
import { RevealImage } from "@/components/motion/reveal-image";
import { RevealText } from "@/components/motion/reveal-text";
import { toast } from "@/stores/toast";
import { MeasurementIllustration, OVERLAYS } from "@/components/wizard/figures";
import { measurementDefinitions } from "@/lib/catalog/seed-data";
import { useCartStore } from "@/stores/cart";

const colors = [
  ["ivory", "#FAF7F2"],
  ["linen", "#F2ECE3"],
  ["blush", "#EFE3DD"],
  ["ink", "#1C1917"],
  ["stone", "#6B645C"],
  ["champagne", "#C9A86A"],
  ["gold-ink", "#836636"],
  ["hairline", "#E2D9CC"],
  ["field", "#8F8476"],
  ["error", "#9B2C2C"],
  ["success", "#3F5E45"],
] as const;

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-hairline py-12">
      <h2 className="label mb-8 font-sans text-stone">{title}</h2>
      {children}
    </section>
  );
}

export function Styleguide() {
  const [drawer, setDrawer] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [modal, setModal] = useState(false);
  const [shipping, setShipping] = useState<string>("standard");
  const [payment, setPayment] = useState<string>("card");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const addToCart = useCartStore((s) => s.add);

  return (
    <div className="container-page pb-24 pt-[calc(var(--header-h)+48px)]">
      <h1 className="font-serif text-h1 font-light">Styleguide</h1>
      <p className="measure mt-4 text-stone">
        Phase 1 components and tokens. Development only; not linked from the site.
      </p>

      <Block title="Colour">
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {colors.map(([name, hex]) => (
            <li key={name}>
              <span className="block aspect-[4/3] border border-hairline" style={{ background: hex }} />
              <span className="mt-2 block text-small">{name}</span>
              <span className="nums block text-small text-stone">{hex}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Type">
        <div className="flex flex-col gap-6">
          <p className="font-serif text-display font-light">Made for Your Moment.</p>
          <p className="font-serif text-h1 font-light">Fustane nusërie</p>
          <p className="font-serif text-h2">The Dress You Will Remember.</p>
          <p className="font-serif text-h3">Aurora silk gown</p>
          <p className="measure font-serif text-lead">
            Çdo fustan nis mbi tryezën e atelesë: pëlhura zgjidhet me dorë, modeli pritet sipas masave të tua.
          </p>
          <p className="measure text-body">
            Every dress begins on the atelier table: the fabric chosen by hand, the pattern cut to your measurements.
          </p>
          <p className="text-small text-stone">Small text for captions and helper copy.</p>
          <p className="label">Uppercase label</p>
          <p className="wordmark">Jela Fashion</p>
          <p className="nums font-serif text-price">€1.240,00</p>
        </div>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button magnetic>Shop the Collection</Button>
          <Button variant="secondary">Made to Measure</Button>
          <Button variant="text">About the atelier</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
          <Button
            loading={loading}
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2500);
            }}
          >
            Place order
          </Button>
        </div>
        <div className="on-image mt-6 flex flex-wrap gap-4 bg-stone p-8">
          <Button variant="on-image">On image</Button>
        </div>
      </Block>

      <Block title="Form fields">
        <ErrorSummary
          autoFocus={false}
          submitCount={1}
          errors={[
            { fieldId: "sg-email", message: "Enter a valid email address, like name@example.com." },
            { fieldId: "sg-country", message: "This field is required." },
          ]}
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Input id="sg-name" label="First name" autoComplete="given-name" />
          <Input
            id="sg-email"
            label="Email"
            type="email"
            defaultValue="name@"
            error="Enter a valid email address, like name@example.com."
          />
          <Input label="Waist circumference" inputMode="decimal" suffix="cm" size="lg" hint="Around the narrowest part of your waist." />
          <Input label="Apartment, suite" optionalLabel="optional" />
          <Select
            id="sg-country"
            label="Country / region"
            placeholder="Select"
            defaultValue=""
            error="This field is required."
            options={[
              { value: "XK", label: "Kosovo" },
              { value: "AL", label: "Albania" },
              { value: "DE", label: "Germany" },
              { value: "CH", label: "Switzerland" },
            ]}
          />
          <Textarea label="Notes for the atelier" optionalLabel="optional" />
          <Checkbox label="Email me with news and offers" />
          <Checkbox label="I accept the terms" error="This field is required." />
        </div>
      </Block>

      <Block title="Radio group">
        <div className="grid gap-10 md:grid-cols-2">
          <RadioGroup
            name="shipping"
            legend="Shipping method"
            value={shipping}
            onValueChange={setShipping}
            options={[
              { value: "standard", label: "Standard", description: "5–8 working days", aside: "€15,00" },
              { value: "express", label: "Express", description: "2–4 working days", aside: "€35,00" },
            ]}
          />
          <RadioGroup
            name="payment"
            legend="Payment"
            variant="card"
            value={payment}
            onValueChange={setPayment}
            options={[
              { value: "card", label: "Card & online payment", content: "You'll be redirected to Paysera to pay securely." },
              {
                value: "bank",
                label: "Bank transfer",
                content: (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
                    <dt className="text-stone">IBAN</dt>
                    <dd className="nums">[IBAN]</dd>
                    <dt className="text-stone">Reference</dt>
                    <dd className="nums">[ORDER NUMBER]</dd>
                  </dl>
                ),
              },
              { value: "wise", label: "Wise", content: "[WISE ACCOUNT DETAILS]" },
            ]}
          />
        </div>
      </Block>

      <Block title="Badge and skeleton">
        <div className="flex flex-wrap gap-3">
          <Badge tone="success">In stock</Badge>
          <Badge>Made to order · ready in 6 weeks</Badge>
          <Badge tone="gold">Awaiting payment</Badge>
          <Badge tone="ink">In production</Badge>
        </div>
        <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i}>
              <Skeleton className="aspect-[4/5]" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/3" />
            </div>
          ))}
        </div>
      </Block>

      <Block title="Accordion">
        <Accordion
          className="max-w-2xl"
          items={[
            { value: "fabric", title: "Fabric & care", content: "[FABRIC DETAILS]. Dry clean only." },
            { value: "delivery", title: "Delivery & returns", content: "Shipped worldwide. [DELIVERY TIMES]." },
            { value: "mtm", title: "Made to measure", content: "Choose Custom size and enter your measurements step by step." },
          ]}
        />
      </Block>

      <Block title="Overlays and feedback">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setDrawer(true)}>Drawer (right)</Button>
          <Button variant="secondary" onClick={() => setSheet(true)}>Drawer (bottom)</Button>
          <Button variant="secondary" onClick={() => setModal(true)}>Modal</Button>
          <Button variant="secondary" onClick={() => toast({ title: "Added to cart", description: "Aurora silk gown, size M", tone: "success" })}>
            Toast
          </Button>
          <Button variant="secondary" onClick={() => toast({ title: "The upload didn't finish. Try again.", tone: "error" })}>
            Error toast
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              addToCart({ key: `demo-${Date.now()}`, productId: "demo", slug: "drita", name: "Aurora silk gown", priceEUR: 1240, size: "M", colorHex: "#F4EDE1" })
            }
          >
            Add demo item to cart
          </Button>
        </div>
        <Drawer open={drawer} onOpenChange={setDrawer} title="Filters" footer={<Button className="w-full">Show 12 dresses</Button>}>
          <p className="text-stone">Drawer content scrolls independently.</p>
        </Drawer>
        <Drawer side="bottom" open={sheet} onOpenChange={setSheet} title="Sort">
          <p className="text-stone">Bottom sheet for mobile filters.</p>
        </Drawer>
        <Modal
          open={modal}
          onOpenChange={setModal}
          title="Leave without saving?"
          description="Your measurements so far will be lost."
          actions={
            <>
              <Button onClick={() => setModal(false)}>Keep measuring</Button>
              <Button variant="secondary" onClick={() => setModal(false)}>Leave</Button>
            </>
          }
        />
      </Block>

      <Block title="File upload">
        <FileUpload className="max-w-xl" label="Payment proof" value={file} onChange={setFile} />
      </Block>

      <Block title="Measurement illustrations">
        <ul className="grid grid-cols-3 gap-4 md:grid-cols-6">
          {measurementDefinitions.map((m) => (
            <li key={m.id} className="bg-blush/60 p-2">
              <MeasurementIllustration view={m.view} measurementId={OVERLAYS[m.id] ? m.id : undefined} className="h-auto w-full" />
              <p className="mt-2 text-[11px] leading-tight">{m.label.en}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Motion">
        <RevealText lines={["Your Measurements.", "Your Dress."]} className="font-serif text-h2" />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <RevealImage>
            <ImagePlaceholder ratio="3/4" tone="blush" />
          </RevealImage>
          <Parallax className="aspect-[3/4]">
            <ImagePlaceholder ratio="3/4" tone="linen" className="h-full" />
          </Parallax>
        </div>
        <Marquee className="mt-12" items={["Handmade in Prizren", "Made to measure", "Worldwide shipping"]} />
      </Block>
    </div>
  );
}
