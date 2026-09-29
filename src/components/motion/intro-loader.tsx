import { getTranslations } from "next-intl/server";
import { IntroSkip } from "./intro-skip";

const WORD = "JELA FASHION";
const KEY = "jf-intro";

/**
 * First visit per session: wordmark letters rise, the tape line draws, then a curtain wipe.
 * Runs on CSS alone so it finishes even before hydration or without JS; an inline script
 * hides it on repeat visits before first paint. Reduced motion: never shown.
 */
export async function IntroLoader() {
  const t = await getTranslations("intro");
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem("${KEY}"))document.documentElement.setAttribute("data-intro-seen","")}catch(e){}`,
        }}
      />
      <div className="intro fixed inset-0 z-[70] flex items-center justify-center bg-ivory" aria-hidden>
        <div className="flex flex-col items-center">
          <p className="wordmark flex text-[clamp(1.5rem,1.2rem+1.5vw,2.25rem)]">
            {WORD.split("").map((ch, i) => (
              <span key={i} className="block overflow-hidden">
                <span className="intro-letter block" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
                  {ch === " " ? " " : ch}
                </span>
              </span>
            ))}
          </p>
          <span className="intro-line mt-5 block h-px w-full origin-left bg-champagne" />
        </div>
      </div>
      <IntroSkip storageKey={KEY} label={t("skip")} />
    </>
  );
}
