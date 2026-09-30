import { Panel } from "./ui";

export const METHOD_LABELS = { paysera: "Kartelë", bank_transfer: "Transfertë bankare", cash_agency: "Agjenci transferi", wise: "Wise" } as const;

/** Shown when neither Supabase secrets nor the local development database are available. */
export function Unavailable() {
  return (
    <Panel title="Paneli nuk është i lidhur">
      <p className="max-w-2xl text-stone">
        Vendos <code>SUPABASE_SERVICE_ROLE_KEY</code> në Vercel (Settings → Environment Variables) që paneli të lexojë dhe të ruajë porositë dhe katalogun.
      </p>
    </Panel>
  );
}
