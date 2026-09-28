# Jela Fashion — design system (MASTER)

Global rules for every page. A file in `pages/<page>.md` overrides this file for that page
only. Brand rules in `/CLAUDE.md` win over anything here and over any skill output.

> Provenance: hand-authored in Phase 0 with the `frontend-design` skill. The
> `ui-ux-pro-max` generator has not been run (the skill is not installed in this repo).
> When it is, run it with `--persist`, then merge its output into this file and record any
> conflict under **Decisions**. Do not let it overwrite the brand rules.

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
  transparent 55%)`. That's the only gradient allowed.
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
  floating label in `small`, unit suffix inside right edge in `stone`. Error: border and
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
  `animate` to target states, never chained timeouts).

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
- [ ] Forms: labels, `autocomplete`, `inputmode`, inline Zod errors, translated.
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
