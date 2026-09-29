# Jela Fashion

E-commerce site for Jela Fashion, a handmade bridal, evening and short dress atelier in
Prizren, Kosovo. Albanian (default) and English, mobile first, shipped worldwide.

Project rules, brand rules and the phase plan live in [`CLAUDE.md`](CLAUDE.md). The design
system is in [`design-system/jela-fashion/MASTER.md`](design-system/jela-fashion/MASTER.md)
with page overrides in `design-system/jela-fashion/pages/`.

## Stack

Next.js 16 (App Router, Server Components, Server Actions) · TypeScript strict ·
Tailwind CSS 4 · Motion (Framer Motion) · Lenis · GSAP · next-intl · Zustand ·
React Hook Form + Zod · Radix UI primitives · Lucide icons. Supabase, Resend and Paysera
arrive in later phases.

## Setup

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional in Phase 1
npm run dev                  # http://localhost:3000 → redirects to /sq
```

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Development server                             |
| `npm run build`     | Production build                               |
| `npm run start`     | Serve the production build                     |
| `npm run lint`      | ESLint                                         |
| `npm run typecheck` | TypeScript, no emit                            |
| `npm run qa`        | Playwright screenshots, overflow and axe checks against a running server (`BASE`, `OUT` env vars) |

`/sq/styleguide` shows every base component and token (development only).

## Structure

```
messages/            sq.json, en.json (all UI copy)
src/app/[locale]/    pages, layout, not-found, error, page transition template
src/app/actions/     Server Actions (validate with Zod, never trust input)
src/components/ui/       Button, Input, Textarea, Select, Checkbox, RadioGroup, Drawer,
                         Modal, Accordion, Toaster, Badge, Skeleton, FileUpload,
                         ErrorSummary, ImagePlaceholder
src/components/motion/   MotionProvider (Lenis), RevealText, RevealImage, Parallax,
                         Marquee, Magnetic, IntroLoader
src/components/layout/   SiteHeader, MobileMenu, CartDrawer, SiteFooter, NewsletterForm,
                         LanguageSwitcher
src/i18n/            routing (localized slugs), navigation, request config
src/proxy.ts         locale detection and redirects (Next 16 "proxy", formerly middleware)
src/stores/          Zustand: cart and wishlist (persisted), UI, toasts
```

## Deploying to Vercel

Import the repository in Vercel, set the environment variables from `.env.example`, and
deploy. No extra build settings are needed.
