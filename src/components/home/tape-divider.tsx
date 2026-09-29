/**
 * The brand's one ornament: a champagne rule with tape-measure ticks.
 * Short tick every 8px, long tick every 40px. Used once per page at most.
 */
export function TapeDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <svg className="block h-3 w-full text-champagne" preserveAspectRatio="none">
        <defs>
          <pattern id="tape-ticks" width="40" height="12" patternUnits="userSpaceOnUse">
            <path d="M0.5 0v12M8.5 0v4M16.5 0v4M24.5 0v4M32.5 0v4" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeWidth="1" />
        <rect x="0" y="0" width="100%" height="12" fill="url(#tape-ticks)" />
      </svg>
    </div>
  );
}
