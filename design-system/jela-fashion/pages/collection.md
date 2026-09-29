# Collection — overrides

- Nav is solid ivory from the start (no transparent state).
- Editorial banner per category: 3:4 image right (cols 7–12) with the category `h1` and
  one `lead` sentence left on desktop; on mobile a 4:5 image with the `h1` below it (never
  text over the image, so the grid starts quickly).
- Toolbar: sticky under the nav. Mobile: "Filter" and "Sort" as two equal buttons with a
  1px hairline between; filters open in a bottom drawer (max 85vh) with "Show N dresses"
  as the primary action. Desktop: filters in a left column (cols 1–3), grid in 4–12.
- Grid: mobile 2 columns (12px gap) default, 1 column "large" toggle. Desktop 3 columns
  default, 2 columns "large". Toggle icons: Lucide `Grid2x2` / `Square`.
- Product card: 4:5 image, name in `h3` at 20px, price `price` 18px, colors as 10px
  swatches. Hover (desktop): second image cross-fades over 600ms, "Quick add" bar slides up
  from the image bottom (ivory, `label`). No card border, no shadow.
- Active filters show as removable chips above the grid (1px `field` border, `small`
  text, 44px tall). Chips wrap to new lines; if more than one row on mobile, collapse to a
  "+n more" button that expands. Never clip or hide chips in a single scrolling row.
- Filters sync to the URL (`?category=&color=&length=&sleeves=&price=&availability=&sort=`).
- "Load more" is a secondary button, centered, with "Showing 12 of N" in `small` above.
- Skeletons match card geometry exactly (4:5 block + two text bars).
- Empty result: "No dresses match these filters." + "Clear filters" button.
- No scroll-reveal on cards. Motion here is hover and filter transitions only.
