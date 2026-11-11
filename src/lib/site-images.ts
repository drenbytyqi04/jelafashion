// Slots outside the product catalogue. Every photo is the atelier's own (public/photos).
// A null slot shows the neutral croquis placeholder until the atelier sends a photo for
// it (short dresses). Notes are in PHOTO-CREDITS.md. Swap a path here to change a slot.

export const siteImages = {
  hero: "/photos/jf-look-8.jpg",
  /** Landscape hero for screens from 1024px (art-directed in HeroMedia): a triptych of three gowns. */
  heroWide: "/photos/jf-hero-wide.jpg",
  categoryBridal: "/photos/jf-drita-1.jpg",
  categoryEvening: "/photos/jf-zana-1.jpg",
  categoryShort: null,
  bridalFeatureMain: "/photos/jf-bora-1.jpg",
  bridalFeatureDetail: "/photos/jf-yllka-1.jpg",
  atelierStory: "/photos/jf-look-4.jpg",
  atelierMain: "/photos/jf-look-5.jpg",
  atelierDetail: "/photos/jf-look-15.jpg",
  finalCta: "/photos/jf-final-wide.jpg",
  bannerBridal: "/photos/jf-lirika-1.jpg",
  bannerEvening: "/photos/jf-hena-1.jpg",
  bannerShort: null,
  bannerAll: "/photos/jf-look-1.jpg",
  bannerNewIn: "/photos/jf-look-6.jpg",
  lookbook: [
    "/photos/jf-look-1.jpg",
    "/photos/jf-look-12.jpg",
    "/photos/jf-look-2.jpg",
    "/photos/jf-look-14.jpg",
    "/photos/jf-look-3.jpg",
    "/photos/jf-look-13.jpg",
  ],
  instagram: [
    "/photos/jf-drita-1.jpg",
    "/photos/jf-look-11.jpg",
    "/photos/jf-lirika-1.jpg",
    "/photos/jf-look-7.jpg",
    "/photos/jf-zana-1.jpg",
    "/photos/jf-look-10.jpg",
  ],
} as const;
