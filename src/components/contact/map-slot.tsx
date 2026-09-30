"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";

// Prizren's centre; the atelier's exact address is set by the atelier ([STREET ADDRESS]).
const BBOX = "20.7247,42.2059,20.7547,42.2219";
const MARKER = "42.2139,20.7397";

/** Loads OpenStreetMap only on request: no third-party request until the visitor asks. */
export function MapSlot({ label, note, title }: { label: string; note: string; title: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-linen">
      {shown ? (
        <iframe
          title={title}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${BBOX}&layer=mapnik&marker=${MARKER}`}
          className="absolute inset-0 h-full w-full grayscale-[60%]"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <MapPin aria-hidden size={24} strokeWidth={1.25} />
          <button type="button" onClick={() => setShown(true)} className="flex min-h-11 items-center text-small">
            <span className="link-underline">{label}</span>
          </button>
          <p className="max-w-xs text-small text-stone">{note}</p>
        </div>
      )}
    </div>
  );
}
