# Jela Fashion — project guide

Premium e-commerce site for **Jela Fashion**, a handmade bridal, evening and short dress
atelier in Prizren, Kosovo (Instagram: @jelafashionpz). Standard sizes XS–XXL and
made-to-measure, shipped worldwide. Most traffic comes from Instagram and Meta ads on
mobile, so **mobile is the priority**.

Goal: a woman arriving from an Instagram ad thinks "this is a real couture house; I trust
them with my wedding dress". Reference level: Elie Saab, Zuhair Murad, Pronovias. Never a
local-shop, template or AI-generated look.

Every page follows: **DESIRE → COLLECTION → PERFECT FIT → TRUST → ORDER**.

## Fact rules (strict)

- Confirmed facts only: the name Jela Fashion, the city Prizren, the Instagram handle,
  handmade dresses, custom sizes, worldwide shipping.
- Never invent awards, press, celebrity clients, years in business, review counts, ratings,
  number of brides, or any statistic.
- Where such content belongs, use visible placeholders editable in admin:
  `[REVIEW TEXT]`, `[YEAR FOUNDED]`, `[PHONE NUMBER]`, `[IBAN]`, etc.

## Design system

- Source of truth: `design-system/jela-fashion/MASTER.md`. Page overrides live in
  `design-system/jela-fashion/pages/<page>.md` and win over MASTER for that page.
- Read MASTER.md and the matching page file before building any page.
- Brand rules (below) beat any skill recommendation. Record every conflict and the
  decision in MASTER.md under "Decisions".
- Skills (in `.claude/skills/`):
  - `frontend-design` for aesthetic direction, typography, composition and motion.
  - `ui-ux-pro-max` (installed via `ui-ux-pro-max-cli`, `uipro init --ai claude`) for UX,
    accessibility and stack guidance. Its design system was generated and reconciled into
    MASTER.md (raw output in `design-system/jela-fashion/reference/`). Query it while
    building, e.g. `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<topic>" --domain ux`
    or `--stack nextjs`. **Never re-run `--persist --force`** against
    `design-system/jela-fashion`; it would overwrite the reconciled files.
  - The installer also added `banner-design`, `brand`, `design`, `design-system`,
    `slides`, `ui-styling`. They are optional; brand rules still win over all of them.
  - Run the pre-delivery checklist in MASTER.md (which includes ui-ux-pro-max's
    checklist) on every page.

## Brand rules (non-negotiable)

- Mood: minimal, editorial, feminine, soft, luxurious, timeless. **Light theme only.**
- Colors: warm ivory background (~#FAF7F2), near-black text (~#1A1A1A), champagne gold
  (~#C9A86A) ONLY for thin lines, small details, active states and primary buttons. Soft
  blush as a rare secondary tone. No excess gold, neon, glassmorphism, purple/pink
  gradients or heavy shadows.
- Wordmark "JELA FASHION": high-contrast serif (Cormorant Garamond), wide tracking.
- Secondary font: refined sans via `next/font` (Manrope — see MASTER.md).
- Layout: generous white space, large 3:4 portrait imagery, asymmetric editorial grids,
  overlapping images, 1px dividers, uppercase micro-labels with wide tracking.
- Imagery: neutral 3:4 placeholders and a hero video slot, all replaceable in admin.
- Copy: elegant, warm, confident, concise, emotional. Never cheesy or generic. **No
  exclamation marks.** Albanian (sq) must read as native Albanian, not a translation.
- Icons: Lucide or Phosphor SVG. Never emojis as icons.

## Tech stack

Next.js latest stable (App Router, Server Components, Server Actions), TypeScript strict,
Tailwind CSS with tokens from MASTER.md, Framer Motion, Lenis, GSAP + ScrollTrigger (only
scroll-driven sequences), Supabase (Postgres, Auth for customers + admin, Storage for images
and payment proofs), Zustand (cart + wishlist, persisted), next-intl (`sq` default, `en`),
React Hook Form + Zod for all forms, Resend + React Email, deploy on Vercel. Ship
`.env.example` and a README with setup steps. All tracking IDs via env vars.

## Motion

Slow, elegant, cinematic, never flashy. Transform/opacity only, lazy-init heavy effects,
60fps, no layout shift, respect `prefers-reduced-motion` everywhere, interrupted animations
must always land in the correct final state. Animate section entrances and key moments
only. Planned moments: first-visit intro loader (wordmark reveal + curtain wipe), page
transitions (fade + slight rise), masked line reveals on headlines, clip-path image
reveals, parallax on large editorial images, slow hover zoom, product-card second-image
cross-fade + quick-add, pinned horizontal lookbook (desktop) / swipe (mobile), marquee,
magnetic primary buttons (desktop), fly-to-cart + cart drawer, wizard slide transitions
with self-drawing measurement lines.

## Scope summary

- **Navigation**: desktop left links (Shop, Bridal, Evening, Short, Made to Measure),
  centered wordmark, right icons (search, account, wishlist, cart count, language);
  transparent over hero, solid ivory on scroll, hide on scroll down / show on scroll up.
  Mobile: centered wordmark, menu + cart; fullscreen menu with staggered serif links,
  category thumbnails, language switcher and WhatsApp.
- **Home** (13 sections): hero video, marquee, 3 category tiles, New In carousel, bridal
  feature, Made to Measure (key trust section, 3 steps), pinned lookbook, atelier story,
  testimonials (`[REVIEW TEXT]`), consultation (WhatsApp + video call), Instagram grid,
  final CTA, newsletter + footer. Bilingual copy lives in the i18n messages.
- **Storefront**: collection (URL-synced filters, sort, grid toggle, load more,
  skeletons, editorial banner), product page (gallery + zoom, swatches, XS–XXL + Custom
  size, status badge, accordions, WhatsApp prefill, consultation, related, recently viewed,
  sticky mobile add-to-cart), search overlay, wishlist, cart drawer + page, checkout,
  account (email + Google, orders, addresses, measurement profiles, proof upload), size
  guide (cm/inch), Made to Measure, About, Contact (form, WhatsApp, Prizren map), FAQ,
  Shipping, Returns, Privacy, Terms, Cookies, branded 404/error.
- **Checkout**: single page, two columns desktop / stacked mobile. Contact → Delivery (all
  countries, default from locale/IP, fallback Kosovo) → Shipping (zone rates from admin) →
  Payment (PaymentProvider interface: Paysera card redirect with verified callback and
  sandbox; bank transfer; cash agencies WU/MoneyGram/Ria with MTCN + sender; Wise) →
  Billing → "Pay now"/"Place order". Offline methods set "Awaiting payment" and allow
  proof upload (image/PDF) + reference. Sticky summary with discount code, totals in EUR.
- **Measurement wizard** (core): full-screen, opens on "Custom size" before add-to-cart.
  One measurement per screen, progress "Step n of N", unit chosen once (cm/inch),
  `inputmode="decimal"`, unit suffix in the field, one-line hint, realistic cm ranges,
  soft confirmable warnings, summary with edit + atelier notes. Config-driven per product.
  "Circumference" (sq: "perimetri") for anything around the body; length/width/height only
  for straight lines. Never ask thigh, ankle or outseam. One consistent hand-built SVG
  line-art figure set (front, back, side + shoe), measured area in a champagne line that
  draws in. Measurements persist on cart line, order, emails and admin; saved profiles for
  users, "remember on this device" for guests.
- **Admin** (`/admin`, admin role): dashboard, products CRUD (images, translations,
  sizes, stock, status, colors, required measurements, SEO), homepage content, collections,
  discount codes, shipping zones, payment methods, orders with status workflow
  (Awaiting payment → Paid → In production → Shipped → Delivered / Cancelled), proof view +
  "Mark as paid", printable measurement sheet, CSV export. Status changes email customers.
- **Emails** in the customer's language: confirmation, payment instructions, payment
  received, status updates, shipping + tracking, shop alerts, contact, newsletter welcome.
- **Tracking**: Meta Pixel + CAPI (deduplicated), GA4, TikTok, consent-gated
  (necessary / analytics / marketing). Floating WhatsApp. Newsletter popup once.
- **SEO**: `/sq` and `/en`, hreflang, canonical, per-page metadata + OG, JSON-LD
  (Organization, ClothingStore, Product, BreadcrumbList), sitemap, robots. Target keywords
  are listed in MASTER.md.
- **Quality bar**: Lighthouse 90+ mobile, WCAG AA, visible focus, keyboard nav, no CLS,
  tested at 375 / 768 / 1024 / 1440px.
- **Seed**: 12 products (4 bridal, 5 evening, 3 short, 350–1600 EUR, varied colors and
  measurement configs), 2 collections, sample shipping zones, one test discount code.

## Phase plan

0. Design system (MASTER.md + page overrides), reconciled with brand rules and
   ui-ux-pro-max output. **Done.**
1. Project setup, tokens, base components (Button, Input, Select, RadioGroup, Drawer,
   Modal, Accordion, Toast, Badge, Skeleton, FileUpload), i18n, nav, footer, motion
   primitives. **Done.** Components are previewed at `/sq/styleguide` (dev only);
   `npm run qa` runs screenshots, overflow and axe checks.
2. Supabase migrations, seed data, home and collection pages. **Done.** Seed data has one source (`src/lib/catalog/seed-data.ts`) that generates
   `supabase/seed.sql` and doubles as the fallback when Supabase env vars are absent.
3. Product page, cart, measurement wizard. **Done.** `npm run qa:product`
   drives the full purchase and wizard flow. The standard size chart in
   `src/lib/catalog/size-chart.ts` must be confirmed by the atelier.
4. Checkout, payment providers, proof upload, emails. **Done.**
   Orders are priced only on the server (`src/app/actions/checkout.ts`); storage goes
   through `orderStore()` (Supabase service role, or `.data/` locally). Paysera has a
   local sandbox when unconfigured. `npm run qa:checkout` drives both payment paths.
5. Customer accounts and admin panel. **Done — awaiting approval.** Passwordless sign-in
   (`src/lib/auth/viewer.ts` is the only identity check); admin at `/admin` in Albanian.
   Without Supabase secrets the site runs on `.data/db.json` (`src/lib/local-db.ts`).
   `npm run qa:admin` drives accounts, the order workflow, stock and catalog edits.
6. Tracking, consent, SEO, performance and accessibility pass.

After each phase: run the dev server, check 375px and desktop, run the pre-delivery
checklist in MASTER.md, fix all errors, then **stop and wait for approval**.

@AGENTS.md
