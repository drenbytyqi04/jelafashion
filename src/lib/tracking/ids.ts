// Public tracking IDs (env vars, never hard-coded). Each is checked against its format so
// nothing unexpected can reach the inline loader scripts.
const match = (v: string | undefined, re: RegExp) => (v && re.test(v) ? v : null);

export const trackingIds = {
  ga4: match(process.env.NEXT_PUBLIC_GA4_ID, /^G-[A-Z0-9]{4,20}$/),
  metaPixel: match(process.env.NEXT_PUBLIC_META_PIXEL_ID, /^\d{6,20}$/),
  tiktok: match(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID, /^[A-Z0-9]{10,30}$/),
};
