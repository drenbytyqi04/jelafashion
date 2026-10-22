# Jela Fashion — full project prompt

Copy everything below the line into an AI coding agent (Claude Code, Cursor, Lovable, …)
to rebuild this project from scratch. No secrets are included; add your own keys in
environment variables.

---

You are a senior product designer and full-stack engineer. Build a production-ready,
premium e-commerce website for **JELA FASHION**, a handmade bridal, evening and short dress
atelier in **Prizren, Kosovo** (Instagram: **@jelafashionpz**). Dresses come in standard
sizes XS–XXL and **made-to-measure**, shipped worldwide. Most traffic arrives from
Instagram and Meta ads **on mobile**, so mobile is the priority in every decision.

## Goal

A woman arriving from an Instagram ad should think: "this is a real couture house; I trust
them with my wedding dress". Reference level: Elie Saab, Zuhair Murad, Pronovias. Never a
local-shop, template or AI-generated look.

Every page follows the story **DESIRE → COLLECTION → PERFECT FIT → TRUST → ORDER**.

## Fact rules (strict)

- Use only confirmed facts: the name Jela Fashion, the city Prizren, the Instagram handle,
  handmade dresses, custom sizes, worldwide shipping.
- Never invent awards, press, celebrity clients, years in business, review counts, ratings,
  number of brides or any statistic.
- Where such content belongs, show visible placeholders that are editable in the admin:
  `[REVIEW TEXT]`, `[YEAR FOUNDED]`, `[PHONE NUMBER]`, `[EMAIL]`, `[IBAN]`,
  `[BENEFICIARY]`, `[SWIFT]`, `[BANK NAME]`, etc.

## Brand rules (non-negotiable)

- Mood: minimal, editorial, feminine, soft, luxurious, timeless. **Light theme only.**
- Colours (Tailwind tokens):

  | Token | Hex | Use |
  |---|---|---|
  | ivory | #FAF7F2 | page background |
  | linen | #F2ECE3 | alternate sections, footer, image placeholders |
  | blush | #EFE3DD | rare secondary tone, max once per page |
  | ink | #1C1917 | text, icons, scrims |
  | stone | #6B645C | muted text |
  | champagne | #C9A86A | ONLY 1px lines, small details, active states, primary buttons (ink text on it), focus ring |
  | gold-ink | #836636 | gold-toned text |
  | hairline | #E2D9CC | dividers |
  | field | #8F8476 | input borders |
  | error | #9B2C2C | errors |
  | success | #3F5E45 | confirmations |

- No excess gold, neon, glassmorphism, purple/pink gradients or heavy shadows. Layers are
  separated by surface colour and 1px lines; the only gradients allowed are image scrims.
- Concept, "the tape measure": one 1px champagne line runs through the site (scroll
  indicator, dividers, active underline, the wizard's measured band). Optional
  tape-measure tick dividers, at most one per page. Boldness is spent on the
  made-to-measure moment, not on a loud hero.
- Typography, via `next/font`, subsets latin + latin-ext (Albanian needs ë and ç):
  - Wordmark "JELA FASHION": Cormorant Garamond with wide tracking.
  - Cormorant Garamond 300/400/500 + italic: headlines, product names, prices.
  - Manrope 400/500/600: body, UI, forms, buttons and uppercase micro-labels with wide
    tracking.
  - Fluid type scale (perfect fourth) between 375px and 1440px.
- Layout: generous white space, large 3:4 portrait imagery, asymmetric editorial grids,
  overlapping images, 1px dividers.
- Imagery: neutral 3:4 placeholders (a faint croquis line silhouette) and a hero video
  slot, all replaceable in the admin.
- Copy:
  - Elegant, warm, confident, concise, emotional. Never cheesy or generic.
  - **No exclamation marks.**
  - Albanian (sq, default) must read as native Albanian, not a translation; English (en)
    is second.
  - Say "perimetri" (circumference) for anything around the body. Use length/width/height
    only for straight lines.
- Icons: Lucide SVG only, never emojis.

## Tech stack

- Next.js latest stable (App Router, Server Components, Server Actions), TypeScript strict.
- Tailwind CSS with the tokens above.
- Motion: Framer Motion, Lenis smooth scroll, GSAP + ScrollTrigger (only for scroll-driven
  sequences).
- Supabase:
  - Postgres with Row Level Security on every table.
  - Auth for customers and admin.
  - Storage for product images and payment proofs.
- Zustand for cart and wishlist, persisted to localStorage.
- next-intl with `/sq` (default) and `/en`, and localized slugs (e.g. `/sq/dyqani`,
  `/sq/shporta`, `/sq/pagesa`, `/sq/fustan/[slug]`, `/sq/fustane-sipas-masave`,
  `/sq/udhezuesi-i-masave`, `/sq/kontakti`, `/sq/llogaria`, `/sq/porosia/[token]`).
- React Hook Form + Zod for every form.
- Resend + React Email.
- Deploy on Vercel (region fra1).
- Ship `.env.example` and a README with setup and launch steps. All tracking IDs and keys
  come from environment variables.
- When Supabase env vars are missing, the site must still run on local seed data and a
  local JSON file store, so it can be developed and tested without any keys.

## Motion

- Slow, elegant, cinematic, never flashy.
- Animate transform and opacity only, lazy-init heavy effects, keep 60fps, and cause no
  layout shift.
- Respect `prefers-reduced-motion` everywhere. An interrupted animation must always land in
  its correct final state.
- Moments:
  - first-visit intro loader (wordmark reveal + curtain wipe)
  - page transitions (fade + slight rise)
  - masked line reveals on headlines
  - clip-path image reveals
  - parallax on large editorial images
  - slow hover zoom
  - product card: second-image cross-fade + quick-add
  - pinned horizontal lookbook on desktop, swipe on mobile
  - marquee
  - magnetic primary buttons (desktop only)
  - fly-to-cart + cart drawer
  - wizard slide transitions with self-drawing measurement lines

## Navigation

- **Desktop:**
  - Left links: Shop, Bridal, Evening, Short, Made to Measure.
  - Centered wordmark.
  - Right icons: search, account, wishlist, cart with count, language.
  - Header is transparent over the hero, solid ivory on scroll; it hides on scroll down and
    shows on scroll up.
- **Mobile:**
  - Header: centered wordmark, menu button and cart.
  - Menu: fullscreen, with staggered serif links, category photo thumbnails, a language
    switcher and WhatsApp.
- **Footer:** newsletter, link accordions on mobile, payment method chips.
- **Floating WhatsApp** button.

## Home page sections

1. Full-screen hero video (with a poster image), headline with a masked reveal, two CTAs:
   "Shop" and "Made to measure".
2. Marquee (editable in admin).
3. Three category tiles: Bridal, Evening, Short.
4. "New In" carousel.
5. Bridal feature with overlapping images.
6. **Made to Measure**, the key trust section: three numbered steps.
7. Pinned lookbook.
8. Atelier story.
9. Testimonials with `[REVIEW TEXT]` placeholders. Hide this section until real reviews
   exist; keep its data and admin editor.
10. Consultation: WhatsApp and video call.
11. Instagram grid.
12. Final CTA.
13. Newsletter + footer.

## Storefront

- **Collection pages** (shop, bridal, evening, short, new in):
  - editorial banner
  - URL-synced filters (category, colour, size, price) and sort
  - 2-column / 1-column grid toggle on mobile
  - "load more" and skeletons
- **Product page:**
  - gallery with zoom and swipe
  - colour swatches
  - sizes XS–XXL plus **"Custom size"**
  - status badge (in stock / made to order / sold out)
  - accordions (description, fabric & care, delivery, made to measure)
  - WhatsApp message prefilled with the product
  - consultation block, related products, recently viewed
  - **sticky add-to-cart bar on mobile**
- **Search overlay** with results page.
- **Wishlist** (works for guests).
- **Cart:** drawer plus a full cart page.
- **Account** (passwordless email link + optional Google):
  - orders
  - saved addresses
  - saved measurement profiles
  - payment proof upload
- **Content pages:**
  - size guide (cm/inch toggle)
  - Made to Measure, About/Atelier
  - Contact (form, WhatsApp, Prizren map)
  - FAQ, Shipping, Returns, Privacy, Terms, Cookies
- Branded 404 and error pages.

## Measurement wizard (core feature)

1. Choosing "Custom size" opens a **full-screen wizard** before add-to-cart.
2. Intro screen. The unit (cm / inch) is chosen once.
3. One measurement per screen, each with:
   - progress "Step n of N"
   - a large field with `inputmode="decimal"` and the unit suffix inside it
   - a one-line hint
   - realistic cm ranges with clear errors
   - soft, confirmable warnings for unusual combinations (e.g. underbust larger than bust)
4. Never ask thigh, ankle or outseam.
5. Config-driven: each product defines its required measurements (bust, underbust,
   waist, hips, shoulder width, arm length, shoulder-to-floor with heels, heel height, etc.).
6. Illustrations come from one consistent, hand-built SVG line-art figure set (front, back,
   side, plus a shoe for heel height). The measured area is a champagne line that draws in.
7. Summary screen with edit links and an "atelier notes" field.
8. Measurements are saved on the cart line, the order, every email and the admin.
   Logged-in users get saved profiles; guests get "remember on this device".

## Checkout

- Single page: two columns on desktop, stacked on mobile. Sticky order summary; on mobile it
  is a collapsible "Show summary" bar. Discount code field; totals in EUR.
- **Steps:**
  1. **Contact:** email; phone with country prefix select (validated with libphonenumber);
     marketing opt-in.
  2. **Delivery:** all countries, default chosen from locale/IP with Kosovo as fallback.
  3. **Shipping:** zone rates managed in admin.
  4. **Payment**, behind a `PaymentProvider` interface:
     - Paysera card redirect, with a verified callback and a local sandbox when not
       configured
     - bank transfer
     - cash agencies (Western Union / MoneyGram / Ria) with MTCN + sender name
     - Wise
  5. **Billing:** same as delivery, or a different address.
  6. Note for the atelier (wedding date, fitting questions).
  7. Accept the terms, then "Pay now" (card) or "Place order" (offline methods).
- **Prices are computed only on the server.** Never trust client totals. Stock is
  decremented atomically.
- **Offline methods:**
  - The order goes to "Awaiting payment".
  - The order page (private token URL) shows payment details. Each value can be copied in
    one tap; on mobile the label sits above the value.
  - The customer can upload proof (image/PDF, max 10 MB) plus a reference.

## Admin panel (`/admin`, admin role only, Albanian UI)

- Sign-in by email magic link. Only profiles with `role = 'admin'` get in; everyone else
  sees "this account has no access to the panel".
- **Dashboard:**
  - A **"New orders" panel** shows each unseen order in full: customer, contact, address,
    payment, shipping, discount, total, every item with all measurements and notes, and
    the customer note.
  - Orders are marked as seen when opened.
  - The page auto-refreshes every 30s while the tab is visible.
  - The tab title shows a "(n)" count; the nav shows a badge.
- **Products CRUD:** images, sq/en translations, sizes, stock, status, colours, required
  measurements, SEO.
- **Content and settings:** homepage content (hero, marquee, testimonials), collections,
  discount codes, shipping zones, payment method details.
- **Orders:**
  - Status workflow: Awaiting payment → Paid → In production → Shipped (tracking) →
    Delivered / Cancelled. Every status change emails the customer.
  - Proof viewer and a "Mark as paid" action.
  - **Printable A4 measurement sheet** plus a **"Download PDF"** version (pdf-lib), one page
    per custom dress.
  - CSV export.
- The admin must be fully usable on a phone.

## Emails (Resend, in the customer's language)

- Order confirmation.
- Payment instructions.
- Payment received.
- Status updates.
- Shipped + tracking.
- Shop alert to the atelier (`SHOP_NOTIFICATION_EMAIL`) with a link to the admin order.
- Contact form copy.
- Newsletter welcome.
- Sign-in link, sent through Resend when configured, to avoid Supabase's email limits.

## Tracking and consent

- **Tags:** Meta Pixel + Conversions API (deduplicated with a shared event id), GA4 and
  TikTok.
- **Consent:**
  - Every tag goes through one `track()` helper.
  - Nothing fires before consent, with categories necessary / analytics / marketing.
  - The consent banner never covers dialogs.
- **Newsletter popup:** shown once, never over dialogs or on product pages.

## SEO

- `/sq` and `/en` with hreflang and canonical.
- Per-page metadata + Open Graph images.
- JSON-LD: Organization, ClothingStore, Product, BreadcrumbList, WebSite search.
- Sitemap and robots.
- Target keywords: "fustane nusërie Prizren", "fustane mbrëmjeje", "fustane sipas
  masave", "bridal dresses Kosovo", "custom evening dresses".

## Security

- RLS on all tables.
- Service-role key used only on the server.
- Security headers: CSP frame-ancestors, X-Frame-Options, nosniff, Referrer-Policy,
  Permissions-Policy, HSTS.
- Per-address rate limits on public forms (contact, newsletter, sign-in link, discount
  check, order, proof upload), implemented as a Postgres function; fail open.
- Honeypot on the contact form.

## Quality bar

- Lighthouse 90+ on mobile, WCAG AA, visible focus (1px ink outline + champagne ring),
  full keyboard navigation, no CLS.
- Tap targets of at least 44px.
- No horizontal scroll at any width.
- Carousels keep the page gutter when snapped.
- Test at 360 / 375 / 390 / 414 / 768 / 1024 / 1440px.
- Ship Playwright QA scripts: screenshots + overflow + axe, the full purchase and wizard
  flow, both payment paths, and the admin workflow.

## Seed data

- 12 products: 4 bridal, 5 evening, 3 short.
- Prices 350–1600 EUR, varied colours and measurement configs, 2 images each.
- 2 collections, sample shipping zones, one test discount code.
- One source file generates `supabase/seed.sql` and doubles as the offline fallback.

## Build order

Work in phases. After each phase, run the app, check 375px and desktop, fix all errors,
then stop for approval.

0. Design system document (tokens, type, components, page rules).
1. Setup, tokens, base components:
   - Button, Input, Select, RadioGroup, Drawer, Modal, Accordion, Toast, Badge, Skeleton,
     FileUpload
   - i18n, nav, footer, motion primitives, a dev-only styleguide page
2. Supabase migrations, seed, home and collection pages.
3. Product page, cart, measurement wizard.
4. Checkout, payment providers, proof upload, emails.
5. Customer accounts and admin panel.
6. Tracking, consent, SEO, performance/accessibility pass, remaining pages.
7. Launch on Vercel:
   - environment variables
   - Supabase Auth Site URL and Redirect URLs set to the production domain
   - first admin user
   - domain and real content
