# Jela Fashion — design system (MASTER)

Global rules for every page. A file in `pages/<page>.md` overrides this file for that page
only. Brand rules in `/CLAUDE.md` win over anything here and over any skill output.

> Provenance: authored in Phase 0 with the `frontend-design` skill, then reconciled with
> the `ui-ux-pro-max` generator (`--design-system --persist`, page overrides, `--stack
> nextjs`, `--domain ux`). Its raw output is kept for reference in `reference/`; it is not
> authoritative. What was adopted and rejected is listed under **Decisions**. Never re-run
> the generator with `--force` against this folder.

## Concept: the tape measure

Jela Fashion's difference from a bridal boutique is that the dress is cut to _her_ body.
The whole identity grows from the atelier's tape measure:

- **The thread.** One 1px champagne line runs through the site: the scroll indicator
  under the hero, section dividers, the active category underline, the wizard's measured
  band. It's the single recurring gold device. Gold appears nowhere else except primary
  buttons and active states.
- **Ticks, not ornaments.** Where a divider needs weight, it gets small tape-measure ticks
  (short 1px verticals every 8px, a longer one every 40px) instead of flourishes, stars
  or monograms. Use at most one ticked divider per page (see home override).
- **The memorable thing is the made-to-measure moment**, not a loud hero effect. Home
  section 6 and the wizard are where boldness is spent. Everything else stays quiet.

## Color

Named tokens (Tailwind `theme.colors`). Contrast ratios measured against Ivory unless
noted.

| Token        | Hex       | Role                                                          | Contrast        |
| ------------ | --------- | ------------------------------------------------------------- | --------------- |
| `ivory`      | `#FAF7F2` | Page background                                               | —               |
| `linen`      | `#F2ECE3` | Alternate section surface, footer, image placeholders         | —               |
| `blush`      | `#EFE3DD` | Rare: consultation section, wizard backdrop. Max 1 per page   | —               |
| `ink`        | `#1C1917` | Text, icons, secondary buttons, scrims (warm, not blue-black) | 16.4:1          |
| `stone`      | `#6B645C` | Muted text, captions, meta, placeholder text                  | 5.5:1 (4.6 blush) |
| `champagne`  | `#C9A86A` | 1px lines, primary button fill, active dots, focus ring       | 2.1:1 (non-text only) |
| `gold-ink`   | `#836636` | Gold-toned **text** (active nav, prices on sale, links in copy) | 5.0:1 (not on blush) |
| `hairline`   | `#E2D9CC` | Decorative 1px dividers, table rules                          | decorative      |
| `field`      | `#8F8476` | Input/checkbox/radio borders (needs 3:1 as a UI component)    | 3.4:1           |
| `error`      | `#9B2C2C` | Inline errors                                                 | 7.0:1           |
| `success`    | `#3F5E45` | Confirmations, "In stock"                                     | 6.8:1           |
| `white`      | `#FFFFFF` | Text over hero video/images only                              | 17.5:1 on ink   |

Rules:
- Champagne never carries text on ivory (2.1:1). Primary button = champagne fill with
  **ink** text (7.7:1).
- Over imagery: white text on a bottom scrim `linear-gradient(to top, rgb(28 25 23 / .55),
  transparent 55%)`, and a short top scrim (ink 35% → transparent) under the transparent
  header. Image scrims are the only gradients allowed.
- No shadows for elevation. Layers separate by surface color (ivory/linen) and 1px lines.
  Drawers and modals sit over an `ink` scrim at 40%.
- Focus ring: 1px `ink` outline + 3px `champagne` offset ring (`outline: 1px solid ink;
  box-shadow: 0 0 0 3px champagne` with 2px offset). Always visible on keyboard focus.

## Typography

Two families, clearly distinct, loaded with `next/font/google` (subsets `latin` and
`latin-ext` — Albanian needs ë and ç), `display: swap`, preloaded.

- **Cormorant Garamond** (300, 400, 500 + 400 italic): wordmark, headlines, product names,
  prices, editorial pull text. Chosen over Playfair Display: finer hairlines and a more
  couture, less "wedding-invitation template" feel; Playfair is the default reach.
- **Manrope** (400, 500, 600): body, UI, forms, buttons, micro-labels, admin. Chosen over
  Inter (too neutral/product-UI) and Montserrat (the local-boutique default). Manrope's
  open apertures stay legible at 11–12px tracked uppercase.

Scale (perfect fourth, 1.333, base 16px). Fluid with `clamp()` between 375px and 1440px.

| Token        | Mobile → Desktop | Family / weight          | Leading | Tracking | Use                        |
| ------------ | ---------------- | ------------------------ | ------- | -------- | -------------------------- |
| `display`    | 48 → 112px       | Cormorant 300            | 0.95    | -0.01em  | Hero headline only         |
| `h1`         | 40 → 72px        | Cormorant 300            | 1.0     | -0.01em  | Page titles                |
| `h2`         | 32 → 52px        | Cormorant 400            | 1.05    | 0        | Section headlines          |
| `h3`         | 24 → 30px        | Cormorant 400            | 1.15    | 0        | Product names, card titles |
| `lead`       | 20 → 22px        | Cormorant 400            | 1.55    | 0        | Editorial paragraphs       |
| `body`       | 16px             | Manrope 400              | 1.65    | 0        | Body copy, max 65ch        |
| `small`      | 14px             | Manrope 400              | 1.55    | 0        | Captions, helper text      |
| `label`      | 11 → 12px        | Manrope 500, UPPERCASE   | 1.4     | 0.22em   | Nav, buttons, micro-labels |
| `wordmark`   | 18 → 22px        | Cormorant 500, UPPERCASE | 1       | 0.38em   | "JELA FASHION"             |
| `price`      | 18 → 22px        | Cormorant 500, lining nums | 1     | 0.02em   | Prices                     |

Rules:
- Headlines are set whole. No single-word italic, bold or color accents.
- Italic Cormorant is reserved for one use: short editorial pull quotes (testimonials).
- Uppercase `label` is used for nav, buttons, filter names and the few micro-labels the
  brief names (hero label, category tiles). It is **not** placed above every heading.
- Body paragraphs max 65ch; editorial `lead` max 34em.
- Numbers in prices/measurements: `font-variant-numeric: lining-nums tabular-nums`.

## Layout

- Mobile first. Breakpoints: `sm 375`, `md 768`, `lg 1024`, `xl 1440`. Max content width
  1440px; full-bleed imagery may exceed it.
- Grid: 4 columns mobile (16px gutter, 20px side margin), 12 columns desktop (24px gutter,
  48px margin at lg, 80px at xl).
- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160. Section rhythm: 96px
  mobile, 160px desktop. Sections own their padding; components never add outer margins
  (prevents the section/cta specificity fights).
- Alignment: **left-aligned** copy by default, set against an asymmetric grid (text in
  cols 2–6, image in cols 7–12, or mirrored). Centered only for the wordmark, the hero
  headline block and the final CTA.
- Imagery: 3:4 portrait default, 4:5 for product cards on mobile, full-bleed 16:9/9:16 for
  hero and final CTA. Radius **0** on imagery, buttons and inputs (couture convention; the
  lines do the softening). Only swatches (circle) and the cart count (circle) are round.
- Overlap: at most one overlapping-image composition per page (bridal feature on home,
  atelier story on About). Overlap offset: 1 column horizontally, 96px vertically.

## Components (visual rules for Phase 1)

- **Button primary**: champagne fill, ink `label` text, 52px tall (48 min touch), 32px side
  padding, no radius. Hover (desktop): fill darkens to `#BE9C5C`, magnetic pull ≤ 6px.
- **Button secondary**: 1px ink border, transparent, ink text. Over imagery: 1px white
  border, white text.
- **Text link**: ink with a 1px underline that grows from the left on hover (champagne).
- **Input**: 1px `field` border on all sides, 52px tall, 16px text (prevents iOS zoom),
  static label above the field in `small` (never a placeholder-only or floating label), unit suffix inside right edge in `stone`. Error: border and
  message in `error`, message below with an icon, `aria-describedby`.
- **Radio card** (shipping/payment): 1px `field` border; selected = 1px ink border + 3px
  champagne inner left rule. Expands content with height animation.
- **Badge**: `label` style, 1px border, no fill. "In stock" success border; "Made to order"
  stone border.
- **Drawer/Modal**: ivory surface, ink scrim 40%, 1px hairline top rule, close icon 44px hit
  area. Drawer slides from right on desktop, from bottom on mobile for filters.
- **Skeleton**: linen blocks with a slow (1.6s) opacity pulse, never a shimmer gradient.
- **Icons**: Lucide, stroke 1.25, 20px (24px nav). Same stroke weight as the wizard
  illustrations so the line language matches.

## Motion

Tokens:
- `ease-couture`: `cubic-bezier(0.22, 1, 0.36, 1)` (entrances, reveals)
- `ease-curtain`: `cubic-bezier(0.76, 0, 0.24, 1)` (curtain, page transitions)
- Durations: `micro 200ms`, `ui 400ms`, `reveal 900ms`, `cinematic 1400ms`.
- Stagger: 70ms per line/item, cap total stagger at 500ms.

Rules:
- Transform and opacity only (clip-path for image reveals, which is compositor-friendly).
- One orchestrated moment per page load. On home that's the intro loader (first visit
  only, ≤ 2.2s, skippable, stored in sessionStorage) flowing into the hero headline reveal.
- Scroll entrances only on: section headlines (masked line reveal), large editorial images
  (clip-path reveal). Not on every card, paragraph or button.
- Parallax: max 8% translate, desktop only, on ≤ 2 images per page.
- Hover zoom: `scale(1.04)` over 1200ms `ease-couture`.
- `prefers-reduced-motion: reduce`: no loader, no parallax, no marquee movement (shows
  static), no pinned scroll (lookbook becomes a swipe row), reveals become 200ms opacity
  fades. Wizard lines appear drawn.
- Interrupted animations always resolve to the correct final state (use Framer's
  `animate` to target states, never chained timeouts). Required state (cart open, step
  index, selected size) is set directly; never depend on `animationend`/`transitionend`.
- Easing direction: decelerate (`ease-couture`) when arriving, accelerate when leaving,
  linear only for constant-rate progress (marquee, progress bars).
- Continuous motion is limited to the marquee and loading indicators. The marquee pauses
  on hover and focus, stops when off-screen, and has a visible pause control (WCAG
  2.2.2). The wizard band pulses twice, then rests.
- At most 1–2 animated elements per viewport at a time.

## Forms and feedback

From `ui-ux-pro-max --domain ux`, applied to every form (checkout, wizard, account,
contact, newsletter, admin):

- Visible labels always; placeholders are examples, never the label.
- Validate on blur, re-validate on change once a field has errored; never only on submit.
  In React Hook Form this is `mode: "onTouched"` (not `onBlur`, which keeps a fixed
  error visible until the next blur and shifts the layout under the pointer).
- Error text sits below its field, specific ("Enter a postal code with 5 digits"), linked
  with `aria-describedby`, announced via `role="alert"` / `aria-live="polite"`.
- On a failed submit: show an error summary at the top of the form, move focus to it,
  link each item to its field, keep the inline errors.
- Submit buttons show a loading state, then success or error. Never a silent submit.
- Correct `type`, `inputmode` and `autocomplete` on every input.

## Next.js implementation rules

From `ui-ux-pro-max --stack nextjs` (data verified against Next.js 16.2; confirm the
latest stable version at Phase 1 setup):

- App Router only. `next/image` for every image, `next/font` (variable where the family
  offers it) for every font; no `<img>`, no Google Fonts `<link>`.
- Server Actions for mutations (`<form action={…}>`). Every action validates input with
  the shared Zod schema and checks auth/role; actions are public endpoints.
- `updateTag` after mutations whose result must show immediately (cart, admin edits);
  `revalidateTag` for the rest.
- Stream slow data behind `<Suspense>` with skeletons sized to the final layout.

## Voice

Elegant, warm, confident, concise. Sentence case in body and headlines (the headline
examples in the brief are title-case in English; keep them as written for hero/section
headlines, sentence case everywhere else). No exclamation marks. No "best quality",
"stunning", "dream dress" clichés. Albanian is written natively, not translated
(e.g. "Porosit me masa", not "Bëj për masë").

## SEO keywords

sq: fustane nusërie, fustane nusërie Prizren, fustane mbrëmjeje, fustane mbrëmjeje Kosovë,
fustane me porosi, fustane sipas masave.
en: wedding dresses Kosovo, bridal dresses Prizren, evening dresses, made to measure
evening dress, custom size dresses, handmade wedding dress.

## Anti-patterns (do not ship)

- Gold text on ivory; gold fills larger than a button; gold icons.
- Drop shadows, glass blur, gradient washes (except the hero/image scrim).
- Emojis as icons, stock "trust badges", star ratings, invented numbers.
- Rounded-card grids with identical shadows.
- Uppercase eyebrow above every heading; `01 / 02 / 03` markers on non-sequences.
- Arrow glyphs appended to button text.
- Fade-up on every element.
- Dark mode.

## Pre-delivery checklist (run on every page)

- [ ] Matches MASTER + page override; no anti-patterns above.
- [ ] 375 / 768 / 1024 / 1440px: no horizontal scroll, no clipped text, 200% zoom reflows.
- [ ] Contrast AA: body 4.5:1, large text and UI components 3:1 (use table above).
- [ ] Keyboard: every control reachable, visible focus ring, logical order, Esc closes
      overlays, focus trapped in modals and returned on close.
- [ ] Touch targets ≥ 44×44px; `cursor-pointer` on all clickables.
- [ ] `prefers-reduced-motion` verified.
- [ ] No CLS: images have dimensions/aspect ratio, fonts preloaded, skeletons sized.
- [ ] One `h1`, logical `h2`/`h3`, descriptive alt text, aria labels on icon buttons.
- [ ] Both locales render with real copy; Albanian diacritics correct.
- [ ] No invented facts; placeholders use `[BRACKETS]`.
- [ ] Forms: labels, `autocomplete`, `inputmode`, inline Zod errors, focusable error
      summary on submit, loading/success states, translated.
- [ ] No emoji icons; one icon set (Lucide) at one stroke weight.
- [ ] Hover and state changes have transitions from the motion tokens (no instant jumps,
      no layout-shifting hovers).
- [ ] No content hidden behind the fixed nav or the sticky mobile bars
      (`scroll-margin-top`, safe-area insets).
- [ ] Marquee pause control works; no other decorative continuous motion.
- [ ] Lighthouse mobile ≥ 90 for performance, accessibility, SEO.

## Decisions

Conflicts between the brief, `frontend-design` guidance and brand rules, and how they were
resolved.

1. **Ivory + high-contrast serif** is a common generated look. Kept because the brand
   mandates it. Distinction comes from the tape-measure concept, champagne instead of a
   clay accent, zero radius, and restraint.
2. **Uppercase tracked labels**: `frontend-design` flags them as a tell; the brief
   requires them. Kept for nav, buttons, filters and the labels the brief names only.
3. **Middle dot** in "JELA FASHION · PRIZREN" and "Handmade Couture · Prizren": kept, the
   brief specifies the copy. Not used elsewhere as a meta separator.
4. **Near-black**: brief asks for ~#1A1A1A; using warm `#1C1917` so ink sits with ivory
   and champagne instead of reading blue-grey.
5. **Champagne contrast**: #C9A86A fails as text (2.1:1), so a darker `gold-ink #836636`
   exists for any gold-toned text. Champagne stays a line/fill color.
6. **Numbered steps** on Made to Measure: allowed, it's a real sequence.
7. **Footer**: linen, not charcoal. The final CTA image above it is the dark moment; a dark
   footer would merge with it and break the light-only rule's spirit.
8. **Font choice**: Cormorant Garamond + Manrope (reasons in Typography).

9. **Top image scrim** (Phase 1): white header icons over a bright hero frame (a white
   gown) fail contrast, so a short ink scrim sits under the transparent header.
10. **Desktop text navigation from 1360px**: the five links in Albanian don't fit beside a
    centred wordmark below that. From 1024 to 1359px the header keeps the menu button
    plus search, account, wishlist, cart and language.
11. **Static field labels**: labels sit above inputs rather than floating inside them;
    clearer for long Albanian labels and for the adopted "visible labels" UX rule.
12. **Payment methods in the footer** are text marks until official monochrome logo SVGs
    are supplied; drawn imitations of brand logos would look cheap.
13. **Footer and menu links** use `link-quiet` (no rule at rest, champagne rule on hover
    and focus). `link-underline` (always underlined) is for links inside running copy.
14. **Collection filtering runs in the browser** (Phase 2): the server renders the first
    view from the URL, then filter, sort and "load more" update the address with
    `history.replaceState`. Results are instant, so skeletons appear only while a
    collection route is loading. Revisit if the range grows beyond a few hundred dresses.
15. **Sample imagery**: until photos are uploaded, product frames are tinted from the
    dress's first colour and show a front or back croquis, so the grid reads as distinct
    dresses rather than grey boxes. Tints are never used once a real image exists.
16. **Prices are formatted by hand** ("1.450 €" / "€1,450"), not with `Intl`: Node and
    browsers ship different Albanian locale data and the mismatch breaks hydration.
17. **Load more** shows a thin champagne progress rule (shown / total) above the
    button: the tape motif, used as information.
18. **Wizard measured line in `gold-ink`, not champagne** (Phase 3): the line carries the
    step's meaning and sits on blush, where champagne is 1.8:1. `gold-ink` (4.3:1 on blush)
    meets the 3:1 rule for meaningful graphics and still reads as gold.
19. **Payment method cards use Lucide icons, not brand logos** (Phase 4, overrides
    pages/checkout.md "logo row"): card brand, WU/MoneyGram/Ria and Wise marks are
    trademarks with their own usage rules and colours. A monochrome line icon at 70% ink
    plus the names in the description keeps the page calm and legal. Real logos can be
    added once the atelier has the providers' approved assets.
20. **No magnetic pull on the checkout button** (Phase 4): pages/checkout.md allows no
    motion beyond expand/collapse and the button state. The loading line stays.
21. **Checkout header is in normal flow, not fixed** (Phase 4): focus mode has nothing to
    reveal on scroll up, and a static header keeps the form's first field higher on mobile.
22. **Emails fall back to Georgia** for headings: web fonts are unreliable in Gmail and
    Outlook. Ivory ground, champagne hairline under the wordmark, champagne buttons.

23. **Admin copy lives in the admin components, in Albanian only** (Phase 5): the panel is
    the atelier's tool, not customer-facing, so it isn't translated and its strings are
    not in `messages/`. Shared UI (inputs, upload, toasts) still reads `messages/sq.json`.
24. **Passwordless sign-in** (Phase 5): an email link (and optional Google) instead of
    passwords. Fewer steps on mobile, nothing to forget, no password database to protect.
25. **Admin headings in Manrope** (pages/admin.md): the global serif heading style is
    overridden inside the panel; only the sidebar wordmark stays in Cormorant.
26. **Print sheet without colour tint** (Phase 5): the product placeholder on the A4
    measurement sheet is neutral, per "white, ink only".

27. **Search is a page, not an overlay** (Phase 6): the header's search icon opens
    `/search`, which works without JavaScript, can be shared and keeps the back button
    meaningful. The field is focused on arrival, so it feels like an overlay on mobile.
28. **Cookie banner rendered on the server** (Phase 6): a tiny inline script marks a
    first visit before paint, so the banner appears with the page instead of popping in
    after hydration (no layout shift, no flash for returning visitors). Accept and
    decline have equal weight; no dark patterns.
29. **Floating WhatsApp button hidden on dress pages and in checkout** (Phase 6): the dress
    page has its own prefilled WhatsApp link beside the sticky add-to-cart, and checkout
    is focus mode. It also waits until the cookie choice is made, so the two never stack.
30. **Legal pages carry placeholders** (Phase 6): company name, address, business number,
    return window and similar are `[PLACEHOLDER]`s for the atelier and its lawyer; no
    legal fact is invented.
31. **Italic Cormorant is not preloaded** (Phase 6): it appears only in testimonial quotes
    far below the fold. The three upright weights stay preloaded for the headlines and the
    wordmark.
32. **Newsletter prompt stays out of the purchase path** (Phase 6): not on dress pages,
    cart, checkout, account or order pages, and never over an open dialog (menu, cart,
    wizard). The cookie banner sits below dialogs (z-45) so it never covers the wizard's
    or the menu's controls.

### ui-ux-pro-max reconciliation

The generator classified the project as "E-commerce Luxury". Its output and what happened
to each part:

| Generator recommendation | Result | Reason |
| --- | --- | --- |
| Primary `#1C1917` | **Adopted** (already `ink`) | Matches the warm near-black |
| Accent `#A16207` dark gold for CTAs, white text | Rejected | Brand requires champagne `#C9A86A`; `gold-ink #836636` covers gold text |
| Background `#FAFAF9`, card `#FFFFFF`, muted `#E8ECF0`, muted text `#475569` | Rejected | Cool greys/slate clash with warm ivory; brand requires ~#FAF7F2 |
| Border `#D6D3D1` | Rejected | Kept `hairline #E2D9CC` (warmer); `field` covers the 3:1 need |
| Destructive `#DC2626` | Rejected | Too bright for the palette; `error #9B2C2C` passes 7:1 |
| Cormorant + Montserrat | Partly | Cormorant Garamond kept; Montserrat rejected (Typography) |
| Style "Liquid Glass" (translucency, refraction, blur) | Rejected | Brand forbids glassmorphism |
| Shadow scale sm–xl, card hover lift | Rejected | Brand forbids heavy shadows; no card chrome |
| 8/12/16px radius on buttons, cards, modals | Rejected | Radius 0 storefront, 4px admin |
| Modal overlay `backdrop-filter: blur(4px)` | Rejected | Glass effect; plain ink scrim 40% |
| Page pattern "Feature-Rich Showcase" (feature cards, logos) | Rejected | Editorial sections per brief; no invented social proof |
| Home/collection/checkout/wizard: single column, 800px max | Rejected | Brief mandates asymmetric editorial grid and a two-column checkout |
| Hero type `clamp(3rem,10vw,12rem)`, weight 900, -0.05em | Rejected | Heavy grotesk treatment; Cormorant 300 display instead |
| Product: drag-to-rotate, AR, 3D orbit | Rejected | No 3D assets; the gallery and zoom are the brief |
| Collection: filter chips wrap or use a "+n" disclosure, never clip | **Adopted** | See `pages/collection.md` |
| Admin: restrained transitions, purposeful feedback | **Adopted** | Already in `pages/admin.md` |
| Anti-patterns: emoji icons, missing `cursor-pointer`, layout-shifting hovers, low contrast, instant state changes, invisible focus | **Adopted** | Added to the checklist |
| UX: error summary, blur validation, `aria-live`, submit feedback, `inputmode` | **Adopted** | Forms and feedback |
| UX: continuous animation only for loading | Adapted | Brief requires the marquee: it gets a pause control and stops off-screen; wizard pulse limited to two cycles |
| UX: cancellable transitions, easing direction, 1–2 animated elements per view | **Adopted** | Motion |
| Next.js: next/image, next/font, Server Actions + validation, `updateTag`, Suspense | **Adopted** | Next.js implementation rules |
| Checklist: 375/768/1024/1440, no content under fixed nav, no horizontal scroll | **Adopted** | Checklist |
25. **Testimonials section removed from the home page** (Phase 7, at the owner's request):
    placeholder reviews (`[REVIEW TEXT]`) read as empty on a live site, and inventing
    reviews is not allowed. The component, data and admin editor stay; re-add
    `<Testimonials>` to `src/app/[locale]/page.tsx` once real reviews exist.
