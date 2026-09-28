# Measurement wizard — overrides

This is the signature experience. Boldness is spent here.

## Frame

- Full-screen overlay (route-aware so Back on Android closes a step, not the page).
  Background `blush` on the illustration zone, `ivory` below.
- Top bar: product name (`small`, stone), close icon (confirms "Leave without saving?"
  when values exist). Under it a 1px progress track (hairline) with a champagne fill, and
  "Step 4 of 11" in `label`.
- Mobile layout (per step): illustration 45vh (max 360px) · question `h2` at 28px ·
  one-line hint `small` stone · one input · Back (secondary) / Next (primary) pinned to the
  bottom with safe-area inset. Keyboard open: illustration shrinks to 30vh, buttons stay
  visible above the keyboard.
- Desktop: two columns inside a 960px frame, illustration left, question + input right.

## Step 0

"Before you measure" with four short lines (measure over underwear · stand straight,
relaxed · ask someone to help · tape snug, not tight), then a segmented control
Centimetres / Inches. Unit is chosen once and shown as a suffix inside every field.

## Input

- `inputmode="decimal"`, accepts `,` and `.`, one decimal max, 64px tall, number in
  `price` style 28px, suffix "cm"/"in" in stone.
- Enter advances. Autofocus on step enter (desktop only; on mobile focus after the slide
  finishes to avoid keyboard jank).
- Out of range: inline error in `error` below the field, Next disabled.
- Suspicious combinations (under bust ≥ bust; waist > hips + 25cm; hollow to floor >
  height × 0.9): soft warning panel with "Check again" (focus field) and "It's correct"
  (confirm, stored as `confirmedWarning: true`).

## Illustration system

- Hand-built SVG React components: `FigureFront`, `FigureBack`, `FigureSide`, `Shoe`.
  viewBox 0 0 240 480 for figures. Single stroke weight 1.25px, `ink` at 70%, no fills,
  rounded caps, a calm fashion-croquis proportion (about 8 heads) but anatomically honest
  (natural waist at the narrowest point, hip line at the fullest part of the seat, bust
  point at the apex).
- Each measurement declares `{ view, path, kind: 'around' | 'straight' }`. `around` draws
  an ellipse band (front arc solid, back arc dashed); `straight` draws a line with 6px end
  ticks — the tape-measure motif.
- Measured path: 2px `champagne`, `stroke-dasharray` draw-in over 900ms `ease-couture`,
  then a soft opacity pulse (0.7 ↔ 1, 2.4s) until input. Reduced motion: shown drawn, no
  pulse.
- Step change: content slides 24px + fades (400ms); the figure cross-fades only when the
  view changes (front → back → side), otherwise stays put and only the band redraws.

## Wording

"Circumference" for everything measured around the body (sq: "perimetri i …"), "length",
"width", "height" only for straight lines. Examples:

| id | EN question | SQ question |
|----|-------------|-------------|
| bust | Bust circumference | Perimetri i gjoksit |
| underbust | Under bust circumference | Perimetri nën gjoks |
| waist | Waist circumference | Perimetri i belit |
| hips | Hip circumference at the fullest part | Perimetri i vitheve në pjesën më të gjerë |
| shoulder | Shoulder width, point to point across the back | Gjerësia e shpatullave, nga maja në majë mbi shpinë |
| hollowFloor | Hollow to floor, barefoot | Nga gropëza e qafës deri në dysheme, zbathur |
| heel | Heel height you will wear | Lartësia e takës që do të mbash |

## Summary

List of all values as rows (label left, value + unit right, tap to edit that step), notes
textarea "Notes for the atelier (optional)", "Save as profile" (logged in, needs a name) or
"Remember on this device" (guest), primary "Confirm & add to cart".
