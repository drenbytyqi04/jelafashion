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

export const stagger = 0.07;
/** Cap total stagger so long lists never feel slow. */
export const staggerFor = (count: number) => Math.min(stagger, 0.5 / Math.max(count, 1));
