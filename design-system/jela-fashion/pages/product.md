# Product — overrides

- Desktop: gallery cols 1–7 as a vertical stack of 3:4 images (sticky-free), info column
  cols 9–12 sticky at `top: nav + 32px`. Mobile: full-width swipe gallery with a thin
  progress line (champagne, 1px) instead of dots, then info.
- Info order: breadcrumb (`small`), name (`h1` at h2 size — product names are long),
  price, status badge, color swatches (24px, 1px ring on selected), size selector,
  "Add to cart" (primary, full width), "Add to wishlist" (icon + text, secondary),
  WhatsApp (text link with icon), "Book a fitting or video consultation" (text link),
  accordions: Description · Fabric & care · Delivery & returns · Made to measure.
- Size selector: XS S M L XL XXL as 48px square outlined buttons, then a full-width
  "Custom size" button with a small tape icon. Selecting "Custom size" changes the primary
  CTA to "Enter your measurements" and opens the wizard; add-to-cart only happens from
  the wizard summary.
- "Size guide" link beside the size label opens the size guide drawer (cm/inch toggle).
- Status badge: "In stock" (success border) or "Made to order · ready in N weeks" (stone
  border). N comes from the product record.
- Fullscreen zoom: tap/click opens an ivory lightbox, pinch/drag to pan, Esc and
  swipe-down to close.
- Sticky mobile bar appears once the main CTA scrolls out of view: name (truncated), price,
  primary button. 64px tall + safe-area inset, 1px hairline top, ivory.
- Related (4) and recently viewed (up to 8) use collection cards.
- Motion: fly-to-cart thumbnail (600ms `ease-couture`), then cart drawer. Nothing else
  animates on scroll here; the dress is the content.
