# Jela Fashion

E-commerce site for Jela Fashion, a handmade bridal, evening and short dress atelier in
Prizren, Kosovo. Albanian (default) and English, mobile first, shipped worldwide.

Project rules, brand rules and the phase plan live in [`CLAUDE.md`](CLAUDE.md). The design
system is in [`design-system/jela-fashion/MASTER.md`](design-system/jela-fashion/MASTER.md)
with page overrides in `design-system/jela-fashion/pages/`.

## Stack

Next.js 16 (App Router, Server Components, Server Actions) · TypeScript strict ·
Tailwind CSS 4 · Motion (Framer Motion) · Lenis · GSAP + ScrollTrigger · next-intl ·
Zustand · React Hook Form + Zod · Radix UI primitives · Lucide icons · Supabase (Postgres,
Storage; Auth from Phase 5) · Resend + React Email · Paysera.

## Setup

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # everything is optional; without Supabase the sample catalog is used
npm run dev                  # http://localhost:3000 → redirects to /sq (or /en for English browsers)
```

| Command               | What it does                                                        |
| --------------------- | ------------------------------------------------------------------- |
| `npm run dev`         | Development server                                                  |
| `npm run build`       | Production build                                                    |
| `npm run start`       | Serve the production build                                          |
| `npm run lint`        | ESLint                                                              |
| `npm run typecheck`   | TypeScript, no emit                                                 |
| `npm run qa`          | Playwright screenshots, overflow and axe checks against a running server (`BASE`, `OUT` env vars) |
| `npm run qa:product`  | Product page, size guide, measurement wizard and cart flow in Playwright |
| `npm run qa:checkout` | Checkout, bank-transfer and card (sandbox) orders, proof upload, emails; needs a server without Supabase secrets (`JF_LOCAL_ORDERS=1 npm start` for a production build) |
| `npm run db:seed-sql` | Regenerate `supabase/seed.sql` from `src/lib/catalog/seed-data.ts`  |

`/sq/styleguide` shows every base component and token (development only).

## Supabase

The schema lives in `supabase/migrations/` (apply in filename order):

| Migration                       | Contents                                                              |
| ------------------------------- | --------------------------------------------------------------------- |
| `…_foundation.sql`              | `profiles` (customer/admin role), `is_admin()`, new-user trigger      |
| `…_catalog.sql`                 | categories, measurement definitions, products, colours, images, sizes, required measurements, collections |
| `…_content.sql`                 | site content blocks, testimonials, newsletter list + `subscribe_newsletter()` |
| `…_commerce_config.sql`         | shipping zones and rates, discount codes, payment methods             |
| `…_storage.sql`                 | buckets `product-images`, `site-media` (public) and `payment-proofs` (private) |
| `…_hardening.sql`               | advisor fixes: `is_admin()` moved to a private schema, trigger functions not callable over the API, one policy per role/action, FK indexes |
| `…_orders.sql`                  | orders (JF-1001…, secret access token), items with measurement snapshots, payment proofs, status history, Paysera callbacks, atomic `redeem_discount()` |

Row Level Security is on for every table: visitors read published catalog rows only,
admins manage everything, discount codes and the newsletter list are never public.

**Live project:** `bducwcutmikztjcpqayk` (EU Central). All migrations and `seed.sql` are
applied, `supabase/tests/rls.sql` passes against it, and the security advisor's only
remaining notice is `subscribe_newsletter()` being callable by visitors, which is
intentional. Local migration filenames match the project's migration history, so
`supabase db push` sees them as already applied.

For local development and Vercel set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Project Settings → API Keys). Both are public.

**Set up a new project** (e.g. a staging copy)

1. Create a Supabase project (EU region recommended).
2. Apply the migrations, then the sample data:
   - with the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`,
     and run `supabase/seed.sql` in the SQL editor; or
   - paste each migration file, then `seed.sql`, into the SQL editor in order.
3. Copy the project URL and anon key into `.env.local` (and Vercel).
4. Make your first admin: sign up once (Phase 5), then in the SQL editor run
   `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`

`seed.sql` is **sample data**: replace the products, prices, shipping rates and every
`[PLACEHOLDER]` in the admin panel before launch.

**Testing migrations locally** (plain Postgres 15+, no Docker needed): create an empty
database, run `supabase/tests/local-shim.sql` (stands in for Supabase's `auth`/`storage`
schemas; never run it on a real project), the migrations, `seed.sql`, then
`supabase/tests/rls.sql`, which asserts the access rules and rolls back.

## Checkout, payments and email (Phase 4)

**How an order flows**

1. `/sq/pagesa` (`/en/checkout`) collects contact, delivery, shipping, payment and billing.
   The browser's cart is only a wish list: `placeOrder` (`src/app/actions/checkout.ts`)
   re-prices every line from the catalog, checks sizes, stock and custom measurements,
   picks the shipping rate for the country, redeems the discount atomically and stores the
   order. If anything changed, the cart is corrected and the customer asked to confirm.
2. **Bank transfer, money transfer agency (WU / MoneyGram / Ria) and Wise** land on the
   order page (`/sq/porosia/<token>`) with the payment details and the order number as
   reference, plus a proof upload (JPG, PNG, WebP or PDF up to 10 MB, checked by content).
   Status: *Awaiting payment* until the atelier marks it paid (admin, Phase 5).
3. **Card (Paysera)** redirects to Paysera. The order becomes *Paid* only when Paysera's
   server-to-server callback (`/api/payments/paysera/callback`) passes the signature check
   and the amount and currency match. The customer's return alone never marks it paid.

The order page's token link is the customer's key (guests have no account); it is never
indexed and never sent as a referrer.

**Environment** (all server-only; see `.env.example`)

| Variable | Needed for |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | storing orders and proofs (required in production) |
| `RESEND_API_KEY`, `EMAIL_FROM` | customer emails; `EMAIL_FROM` must be on a domain verified in Resend |
| `SHOP_NOTIFICATION_EMAIL` | new order, proof uploaded and card payment alerts to the atelier |
| `PAYSERA_PROJECT_ID`, `PAYSERA_SIGN_PASSWORD`, `PAYSERA_TEST_MODE` | card payments |

**Paysera setup**: create a project at paysera.com, copy the project ID and sign password
into Vercel, keep `PAYSERA_TEST_MODE=true` for a test order, then set it to `false`. The
callback URL is sent with every payment, so nothing has to be entered in Paysera. Set
`NEXT_PUBLIC_SITE_URL` to the live domain so return and callback links point there.

**Without credentials (development)** everything still runs: orders go to
`.data/orders.json`, proofs to `.data/payment-proofs/`, emails are written as HTML to
`.data/emails/`, and "Card" opens a local sandbox page that simulates Paysera. None of
these fallbacks exist in a production deployment (checkout says it is unavailable
instead), except under `JF_LOCAL_ORDERS=1`, which is for local QA only.

**Emails** (`src/emails/`, copy in `messages/*.json` → `emails`) are sent in the language
the customer ordered in: order confirmation (with payment instructions and upload link for
offline methods), payment received, status updates with tracking, newsletter welcome (new
addresses only). The atelier gets Albanian alerts for new orders, proofs and card payments.

**Before launch**: replace `[IBAN]`, `[BENEFICIARY]`, `[RECIPIENT FULL NAME]`,
`[WISE EMAIL]` and the other placeholders in `payment_methods`, and set real shipping
rates.

## Structure

```
messages/                  sq.json, en.json (all UI copy)
supabase/                  migrations, generated seed.sql, local tests
src/app/[locale]/          pages (home, shop, categories, new in), layout, 404, error
src/app/actions/           Server Actions (validate with Zod, never trust input): newsletter,
                           checkout (placeOrder, discount), payment proof upload
src/app/api/payments/      Paysera callback and the local sandbox
src/lib/commerce/          order types, pricing, order store (Supabase / local), shipping
                           and payment config, presentation helpers
src/lib/payments/          PaymentProvider interface, Paysera signing and verification
src/lib/email/, src/emails/ Resend sender (dev outbox), notifications, React Email templates
src/components/checkout/   checkout form and order summary
src/components/order/      order page: payment details, proof upload, card status
src/lib/catalog/           seed data, types, cached repository (Supabase or sample), filters
src/components/home/       the 13 home sections
src/components/collection/ collection page, filters, skeleton
src/components/product/    product card, gallery + zoom, purchase panel, size guide, rails
src/components/wizard/     measurement wizard and its line-art figures
src/components/cart/       cart line (with measurements), cart page
src/components/ui/         Button, Input, Textarea, Select, Checkbox, RadioGroup, Drawer,
                           Modal, Accordion, Toaster, Badge, Skeleton, FileUpload,
                           ErrorSummary, ImagePlaceholder
src/components/motion/     MotionProvider (Lenis), RevealText, RevealImage, Parallax,
                           Marquee, Magnetic, IntroLoader
src/components/layout/     SiteHeader, MobileMenu, CartDrawer, SiteFooter, NewsletterForm,
                           LanguageSwitcher
src/i18n/                  routing (localized slugs), navigation, request config
src/proxy.ts               locale detection and redirects (Next 16 "proxy", formerly middleware)
src/stores/                Zustand: cart and wishlist (persisted), UI, toasts
```

## Deploying to Vercel

Import the repository in Vercel, set the environment variables from `.env.example`, and
deploy. No extra build settings are needed.
