# Admin — overrides

The admin is a working tool for the atelier, not a showroom. Calm, dense, legible.

- Typography: Manrope for everything except the wordmark in the sidebar. Base 14px,
  tables 13px. No Cormorant headlines, no uppercase labels except table headers.
- Surfaces: `ivory` app background, `white` panels with 1px `hairline` borders. Radius 4px
  on panels, inputs and buttons here (overrides MASTER's 0) to read as tooling.
- Layout: 240px left sidebar (Dashboard, Orders, Products, Collections, Homepage,
  Discounts, Shipping, Payments, Customers, Newsletter) on desktop; top bar + drawer on
  mobile. Content max 1280px.
- Spacing scale tightened: 4, 8, 12, 16, 24, 32.
- Status colors for orders (text + 1px border, no fills): Awaiting payment (`gold-ink`),
  Paid (`success`), In production (`ink`), Shipped (`ink`), Delivered (`success`),
  Cancelled (`stone`).
- Dashboard: five stat panels (orders today/week, revenue, awaiting payment, pending
  custom orders, low stock) as plain numbers with labels. No charts in Phase 5.
- Tables: sticky header, row hover `linen`, 44px rows, filters above in one line.
- Measurement sheet (print): A4, white, ink only, wordmark top, product image 3:4 left,
  measurement table right in cm, notes, order number and date. `@media print` hides UI.
- Motion: none except drawers and toasts.
