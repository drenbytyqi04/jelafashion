import type { SVGProps } from "react";

// Lucide ships no brand marks. These are drawn on Lucide's 24px grid with the same
// stroke language so they sit beside Lucide icons without looking borrowed.

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

function base({ size = 20, strokeWidth = 1.25, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...rest,
  };
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 20.5l1.3-4.3A8.5 8.5 0 1 1 8 19.3z" />
      <path d="M9.2 8.6c.2-.4.4-.5.7-.5h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.1.3 0 .5.6 1 1.4 1.8 2.5 2.4.2.1.4.1.5 0l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.3.3.5 0 .6-.3 1.2-.8 1.5-.6.3-1.3.4-2 .2-2.6-.8-4.6-2.8-5.4-5.4-.2-.7-.1-1.5.3-2.1z" />
    </svg>
  );
}
