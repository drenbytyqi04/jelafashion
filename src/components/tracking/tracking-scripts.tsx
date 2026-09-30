"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";
import { trackingIds } from "@/lib/tracking/ids";
import { markTrackingReady, trackPageView } from "@/lib/tracking/track";
import { useConsentStore } from "@/stores/consent";

// Loads each tag only after the matching consent, using the vendors' own loader snippets
// (they define a queue first, so nothing fired meanwhile is lost). Revoking consent clears
// the tags' cookies and reloads, so no tag keeps running.

function inject(code: string) {
  const s = document.createElement("script");
  s.text = code;
  document.head.appendChild(s);
}

function loadGa4(id: string, marketing: boolean) {
  if (window.gtag) return false;
  const ad = marketing ? "granted" : "denied";
  inject(
    `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;` +
      `gtag('consent','default',{analytics_storage:'granted',ad_storage:'${ad}',ad_user_data:'${ad}',ad_personalization:'${ad}'});` +
      `gtag('js',new Date());gtag('config','${id}',{send_page_view:false});`,
  );
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  return true;
}

function loadMeta(id: string) {
  if (window.fbq) return false;
  inject(
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};` +
      `if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;` +
      `s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');` +
      `fbq('init','${id}');`,
  );
  return true;
}

function loadTikTok(id: string) {
  if (window.ttq) return false;
  inject(
    `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],` +
      `ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);` +
      `ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},` +
      `ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};` +
      `n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};` +
      `ttq.load('${id}');}(window,document,'ttq');`,
  );
  return true;
}

const TAG_COOKIES = /^(_ga|_gid|_gat|_fbp|_fbc|_ttp|_tt_)/;

function clearTagCookies() {
  const host = location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (name && TAG_COOKIES.test(name)) {
      for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
    }
  }
}

export function TrackingScripts() {
  const analytics = useConsentStore((s) => s.analytics);
  const marketing = useConsentStore((s) => s.marketing);
  const decided = useConsentStore((s) => s.decidedAt);
  const pathname = usePathname();
  const previous = useRef<{ analytics: boolean; marketing: boolean } | null>(null);
  const firstView = useRef(true);

  // Load (or unload) tags when consent is given or taken back.
  useEffect(() => {
    if (!decided) return;
    const prev = previous.current;
    previous.current = { analytics, marketing };
    if (prev && ((prev.analytics && !analytics) || (prev.marketing && !marketing))) {
      clearTagCookies();
      window.location.reload();
      return;
    }
    const url = window.location.href;
    if (analytics && trackingIds.ga4 && loadGa4(trackingIds.ga4, marketing)) window.gtag?.("event", "page_view", { page_location: url, page_title: document.title });
    if (marketing && trackingIds.metaPixel && loadMeta(trackingIds.metaPixel)) window.fbq?.("track", "PageView");
    if (marketing && trackingIds.tiktok && loadTikTok(trackingIds.tiktok)) window.ttq?.page();
    if (marketing) window.gtag?.("consent", "update", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
    markTrackingReady();
  }, [analytics, marketing, decided]);

  // Page views on client-side navigation (the first view is sent when the tags load).
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    trackPageView(window.location.href);
  }, [pathname]);

  return null;
}
