"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="h-10 rounded-admin border border-ink px-4 text-[0.8125rem] print:hidden">
      Printo
    </button>
  );
}
