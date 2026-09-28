# Checkout — overrides

- Focus mode: nav reduced to the wordmark (centered, links home) and "Secure checkout"
  with a lock icon; no footer links except legal. No marquee, popups, WhatsApp bubble or
  newsletter prompt on this route.
- Desktop: form cols 1–7, summary cols 8–12 on `linen`, sticky, full height. Mobile: a
  collapsible "Show order summary · €1,240" bar at the top (linen), form below, summary
  totals repeated above the final button.
- Sections separated by 1px hairlines and a `h2` at 24px (Cormorant). Numbering is not
  shown (the order is visible and not a wizard).
- Inputs follow MASTER. `autocomplete`: email, given-name, family-name, address-line1,
  address-line2, address-level2, postal-code, country, tel. Phone uses a country-code
  select + `inputmode="tel"`.
- Payment radio cards: logo row (card brands / bank / WU-MoneyGram-Ria / Wise) at 24px
  height, monochrome ink at 70%. Selected card expands its instructions (height animation
  400ms). Bank details render in a definition list with a "Copy" icon button per value.
- Primary button label switches: "Pay now" (Paysera) vs "Place order" (offline methods).
  Loading state keeps width, shows a 1px champagne progress line along the button bottom.
- Custom-size lines in the summary: "Custom size · View measurements" opens a small
  drawer with the measurement table.
- Errors: inline under fields, plus a summary at the top of the form on submit linking
  to each invalid field. Never clear the form on error.
- No motion beyond expand/collapse and the button state.
