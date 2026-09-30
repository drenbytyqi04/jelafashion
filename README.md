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
| `npm run qa:checkout` | Checkout, bank-transfer and card (sandbox) orders, proof upload, emails |
| `npm run qa:admin`    | Accounts and admin: sign-in, order workflow + emails, stock, print sheet, CSV, new product with photo, homepage, access control |
| `npm run db:seed-sql` | Regenerate `supabase/seed.sql` from `src/lib/catalog/seed-data.ts`  |

The `qa:checkout` and `qa:admin` suites need a server on the local development database
(`npm run dev`, or `JF_LOCAL_DATA=1 npm start` for a production build). Start them with
`.data/` and `.next/cache/fetch-cache` removed so the cache and the data agree.

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
| `…_accounts.sql`                | customers' saved addresses and named measurement profiles (owner-only), email index for guest orders |
| `…_stock.sql`                   | atomic `adjust_stock()`: in-stock sizes are taken at checkout and returned on cancellation |

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
4. Make your first admin: sign in once at `/admin/login`, then in the SQL editor run
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
`.data/db.json`, proofs to `.data/payment-proofs/`, emails are written as HTML to
`.data/emails/`, and "Card" opens a local sandbox page that simulates Paysera. None of
these fallbacks exist in a production deployment (checkout says it is unavailable
instead), except under `JF_LOCAL_DATA=1`, which is for local QA only.

**Emails** (`src/emails/`, copy in `messages/*.json` → `emails`) are sent in the language
the customer ordered in: order confirmation (with payment instructions and upload link for
offline methods), payment received, status updates with tracking, newsletter welcome (new
addresses only). The atelier gets Albanian alerts for new orders, proofs and card payments.

**Before launch**: replace `[IBAN]`, `[BENEFICIARY]`, `[RECIPIENT FULL NAME]`,
`[WISE EMAIL]` and the other placeholders in `payment_methods`, and set real shipping
rates.

## Accounts and admin (Phase 5)

**Customers** sign in without a password: an email link, plus Google when enabled.
`/sq/llogaria` (`/en/account`) shows their orders (including ones placed as a guest with
the same email), saved addresses, measurement profiles and profile. Checkout prefills the
signed-in customer's details and saved address, and the measurement wizard offers and
saves account profiles.

**The admin panel** is at `/admin` (Albanian, never indexed), for accounts whose
`profiles.role` is `admin`. It covers the dashboard, orders (status workflow Awaiting
payment → Paid → In production → Shipped → Delivered / Cancelled, each change emailed to
the customer; payment proofs; printable measurement sheet; CSV export), products (text in
both languages, photos, colours, sizes and stock, required measurements, SEO),
collections, homepage (hero text, video and poster, marquee, testimonials), discount codes,
shipping zones, payment method details, customers and the newsletter list (CSV).

Stock: in-stock sizes are taken when an order is placed and returned when it is
cancelled. Photos, videos and payment proofs upload straight from the browser to
Supabase Storage with one-time signed URLs (Vercel functions accept at most 4.5 MB per
request); proofs are checked by content afterwards.

**Supabase Auth setup** (Dashboard → Authentication)

1. URL Configuration: Site URL = your domain; add `https://<domain>/auth/callback`
   (and your Vercel preview URL pattern) to Redirect URLs.
2. Emails: the default sender is rate-limited; set custom SMTP (Resend works:
   `smtp.resend.com`, port 465, user `resend`, password = an API key). Recommended:
   in the "Magic link" template, set the link to
   `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email` (the redirect already
   points at `/auth/callback?next=…`), so the link also works when opened in a
   different browser than the one that asked.
3. Google (optional): enable the provider with a Google Cloud OAuth client, then set
   `NEXT_PUBLIC_AUTH_GOOGLE=true` to show the button.
4. First admin: sign in once at `/admin/login`, then run the SQL from step 4 above.

In development without Supabase, sign-in links land in `.data/emails/`, and
`admin@example.com` (or the addresses in `JF_DEV_ADMINS`) signs in as admin.

## Tracking, consent and SEO (Phase 6)

**Consent.** On a first visit a cookie banner offers *Accept all*, *Decline* and
*Settings* with equal weight (necessary / analytics / marketing). The choice is stored on
the device (`jf-consent` in localStorage; bump its version in `src/stores/consent.ts` to
ask everyone again) and can be changed from the footer ("Cookie settings") or the Cookies
page. Nothing optional loads before a choice.

**Tags.** Set the IDs in Vercel (see `.env.example`); an empty ID switches that tag off.

| Variable | Tag | Consent |
| --- | --- | --- |
| `NEXT_PUBLIC_GA4_ID` | Google Analytics 4 (Consent Mode v2) | analytics |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel | marketing |
| `META_CAPI_ACCESS_TOKEN` (server) | Meta Conversions API, Purchase | marketing |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | TikTok Pixel | marketing |

Events: page views, `view_item`, `add_to_wishlist`, `add_to_cart`, `begin_checkout`,
`purchase` and `lead` (newsletter, contact form), mapped to each tag's own names. The
purchase fires once per order, from the order page, with
`event_id = purchase-<order number>`; the server sends the same event to the Conversions
API (hashed email, phone and name, `fbp`/`fbc` cookies), so Meta counts it once. While
testing, put the Events Manager test code in `META_CAPI_TEST_EVENT_CODE`.

**SEO.** Every page has its own title, description, canonical URL, `hreflang` for `sq`,
`en` and `x-default`, and Open Graph/Twitter tags (a branded image is generated per
language; a dress uses its first photo). JSON-LD: Organization + ClothingStore + WebSite on
the home page, Product and BreadcrumbList on dresses, FAQPage on the FAQ. `/sitemap.xml`
lists every page in both languages; `/robots.txt` keeps out the admin, account, cart,
checkout, order, search and wishlist pages. Dress titles and descriptions can be overridden per
product in the admin (SEO section).

**Pages added.** Made to Measure, Size guide, Atelier (about), Contact (form, WhatsApp,
map slot), FAQ, Shipping (rates from the shipping zones), Returns, Privacy, Terms,
Cookies, Wishlist and Search. Legal pages carry `[PLACEHOLDER]`s (company name, address,
business number, return window…) for the atelier and its lawyer to fill in; nothing
legal is invented. A floating WhatsApp button appears once `NEXT_PUBLIC_WHATSAPP_NUMBER`
is set (hidden on dress pages, which have their own, and during checkout). The newsletter
offer appears once per device after 30 seconds and a scroll, never on dress pages, in the
cart, checkout or account, and never over an open dialog.

**Performance.** Headline fonts are preloaded and the italic is not; the newsletter
form's validation code loads only when the footer comes near. Measure with Lighthouse
against a production build (`npm run build && npm start`), mobile preset.

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
src/app/admin/             admin panel (own root layout; (panel) group is admin-only)
src/components/admin/      admin UI primitives and editors
src/components/account/    sign-in, account shell, addresses, measurements, profile
src/lib/auth/              data access layer (getViewer, requireAdmin), local dev sessions
src/lib/account/           account store (customer's own session, RLS)
src/lib/admin/             catalog admin store (Supabase service role or local file)
src/lib/local-db.ts        development database (.data/db.json) seeded from sample data
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
                           LanguageSwitcher, WhatsApp bubble, newsletter popup
src/components/consent/    cookie banner and preferences (src/stores/consent.ts)
src/lib/tracking/          tag IDs, track() event bus, Meta Conversions API
src/components/tracking/   GA4 / Meta / TikTok loaders, purchase tracker
src/lib/seo.ts             pageMetadata() (canonical, hreflang, OG), JSON-LD helpers
src/app/sitemap.ts, robots.ts, [locale]/opengraph-image.tsx
src/i18n/                  routing (localized slugs), navigation, request config
src/proxy.ts               locale detection and redirects (Next 16 "proxy", formerly middleware)
src/stores/                Zustand: cart and wishlist (persisted), UI, toasts
```

## Launching on Vercel (Phase 7)

1. **Import.** vercel.com → Add New → Project → import `drenbytyqi04/jelafashion`.
   Framework: Next.js, no build settings. Set the production branch (Settings → Git) to
   the branch that holds this code.
2. **Environment variables** (Settings → Environment Variables, Production and Preview):
   - Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (both in
     `.env.example`), `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL`, the
     tracking IDs, `NEXT_PUBLIC_AUTH_GOOGLE` if Google is on.
   - Secret (type *Sensitive*): `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings →
     API Keys → secret key), `RESEND_API_KEY`, `EMAIL_FROM`, `SHOP_NOTIFICATION_EMAIL`,
     `PAYSERA_PROJECT_ID`, `PAYSERA_SIGN_PASSWORD`, `PAYSERA_TEST_MODE`,
     `META_CAPI_ACCESS_TOKEN`.
   - Never set `JF_LOCAL_DATA`, `JF_LOCAL_ORDERS` or `JF_DEV_ADMINS` in Vercel.
   - `NEXT_PUBLIC_SITE_URL`: leave empty until the domain is connected (the project's
     production URL is used meanwhile), then `https://<domain>` and redeploy.
3. **Supabase Auth** (Authentication → URL Configuration): Site URL = the production
   URL; Redirect URLs: `https://<domain>/auth/callback` and
   `https://*-<team>.vercel.app/auth/callback` for previews. Custom SMTP (Resend) as in
   the accounts section.
4. **First admin:** sign in at `/admin/login` with the atelier's email, then run the SQL
   from the Supabase section, step 4.
5. **Domain** (Settings → Domains): add it, point DNS as Vercel shows, then set
   `NEXT_PUBLIC_SITE_URL` and the Supabase Site URL to it. In Resend verify the same
   domain so emails come from it.
6. **Paysera:** each payment sends its own callback URL
   (`/api/payments/paysera/callback`), so nothing to configure there beyond the project
   ID and password. Test with `PAYSERA_TEST_MODE=true`, then set it to `false`.
7. **Before announcing:** replace the sample products, prices and shipping rates in the
   admin; fill every `[PLACEHOLDER]` (legal pages, IBAN, testimonials, year founded);
   place one real order per payment method; check Meta Events Manager (Test events) and
   GA4 DebugView; submit `https://<domain>/sitemap.xml` in Google Search Console.

Without `SUPABASE_SERVICE_ROLE_KEY` the shop browses normally but checkout says it is
unavailable, so the site can go up before payments are ready.
