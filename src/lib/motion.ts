// Motion tokens from design-system/jela-fashion/MASTER.md. Keep in sync with globals.css.

export const ease = {
  couture: [0.22, 1, 0.36, 1] as const,
  curtain: [0.76, 0, 0.24, 1] as const,
  leave: [0.55, 0, 1, 0.45] as const,
};

export const duration = {
  micro: 0.2,
  ui: 0.4,
  reveal: 0.9,
  cinematic: 1.4,
};

/** Exits are about 60% of the matching entrance, so closing never feels like waiting. */
export const exitDuration = {
  micro: 0.12,
  ui: 0.25,
  reveal: 0.55,
};

/** A transition that leaves: shorter, accelerating out. */
export const leave = (d: keyof typeof exitDuration = "ui") => ({ duration: exitDuration[d], ease: ease.leave });

export const stagger = 0.07;
/** Cap total stagger so long lists never feel slow. */
export const staggerFor = (count: number) => Math.min(stagger, 0.5 / Math.max(count, 1));
