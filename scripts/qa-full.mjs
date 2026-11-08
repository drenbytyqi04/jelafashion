// Site-wide audit: every sitemap page (plus cart, checkout, search, wishlist, account and
// 404) at 360/375/390/414/768/1024/1440, and at 375/1440 with reduced motion. Checks
// horizontal overflow, page errors, content left hidden after scrolling the whole page,
// axe (WCAG 2.2 AA, 375 and 1440) and touch targets at 375. Run against a local
// production server (JF_LOCAL_DATA=1 PORT=3100 npm start). Exits 1 on any finding.
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.BASE ?? "http://localhost:3100";
const WIDTHS = [360, 375, 390, 414, 768, 1024, 1440];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const urls = [
  ...new Set([
    ...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname),
    "/sq/shporta",
    "/sq/pagesa",
    "/sq/kerko?q=nata",
    "/sq/te-preferuarat",
    "/sq/llogaria",
    "/sq/nuk-ekziston",
    "/en/cart",
    "/en/checkout",
  ]),
];

// A real cart, so the cart and checkout pages are audited with a dress in them.
const cart = await (async () => {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.addInitScript(() => sessionStorage.setItem("jf-intro", "1"));
  await p.goto(`${BASE}/sq/fustan/nata`, { waitUntil: "networkidle" });
  await p.locator('label:has(input[value="S"])').click();
  await p.getByRole("button", { name: "Shto në shportë" }).first().click();
  await p.waitForTimeout(1500);
  const value = await p.evaluate(() => localStorage.getItem("jf-cart"));
  await p.close();
  return value;
})();

const out = { pages: urls.length, loads: 0, overflow: [], errors: [], hidden: [], axe: [], tap: [] };

for (const reducedMotion of ["no-preference", "reduce"]) {
  for (const w of WIDTHS) {
    if (reducedMotion === "reduce" && w !== 375 && w !== 1440) continue;
    const mobile = w < 800;
    const ctx = await browser.newContext({ viewport: { width: w, height: mobile ? 800 : 900 }, reducedMotion, hasTouch: mobile, isMobile: mobile });
    await ctx.addInitScript((cart) => {
      sessionStorage.setItem("jf-intro", "1");
      sessionStorage.setItem("jf-newsletter-popup", "1");
      localStorage.setItem("jf-consent", JSON.stringify({ state: { analytics: false, marketing: false, decidedAt: "2026-01-01" }, version: 1 }));
      if (cart) localStorage.setItem("jf-cart", cart);
    }, cart);
    const p = await ctx.newPage();
    let current = "";
    p.on("pageerror", (e) => out.errors.push({ url: current, w, reducedMotion, msg: e.message.slice(0, 160) }));

    for (const url of urls) {
      current = url;
      out.loads++;
      try {
        await p.goto(BASE + url, { waitUntil: "networkidle", timeout: 30000 });
      } catch (e) {
        out.errors.push({ url, w, msg: `load: ${e.message.slice(0, 80)}` });
        continue;
      }
      const height = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += 500) {
        await p.evaluate((y) => window.scrollTo(0, y), y);
        await p.waitForTimeout(mobile ? 90 : 60);
      }
      await p.waitForTimeout(1200);

      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) out.overflow.push({ url, w, reducedMotion, overflow });

      if (w === 375 || w === 1440) {
        const hidden = await p.evaluate(() =>
          [...document.querySelectorAll("main h1, main h2, main h3, main p, main img, main a, main button")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) return false;
              if (el.closest("[aria-hidden=true], .sr-only, [inert]")) return false;
              for (let e = el; e && e !== document.body; e = e.parentElement) {
                const cs = getComputedStyle(e);
                if (cs.opacity === "0" || cs.visibility === "hidden" || /inset\(100%/.test(cs.clipPath)) return true;
              }
              return false;
            })
            .slice(0, 4)
            .map((el) => `${el.tagName}:${(el.textContent || el.getAttribute("alt") || "").trim().slice(0, 40)}`),
        );
        if (hidden.length) out.hidden.push({ url, w, reducedMotion, hidden });
      }

      if (reducedMotion === "no-preference" && (w === 375 || w === 1440)) {
        const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        for (const v of r.violations) {
          // target-size reports targets scrolled under the sticky header as "obscured";
          // only count it when the target is actually on screen.
          const nodes = [];
          for (const n of v.nodes) {
            if (v.id === "target-size") {
              const onScreen = await p.evaluate((sel) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return r.top >= 0 && r.bottom <= window.innerHeight;
              }, n.target.join(" ")).catch(() => true);
              if (!onScreen) continue;
            }
            nodes.push(n.target.join(" "));
          }
          if (nodes.length) out.axe.push({ url, w, id: v.id, nodes: nodes.slice(0, 3) });
        }
      }

      if (reducedMotion === "no-preference" && w === 375) {
        const small = await p.evaluate(() =>
          [...document.querySelectorAll("a, button, input:not([type=hidden]), select, textarea, summary")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) return false;
              if (el.closest("[aria-hidden=true], .sr-only, [inert]") || el.matches(".sr-only, .sr-only-focusable, .peer")) return false;
              if (el.tabIndex < 0) return false; // duplicates of a larger link (card titles)
              const cs = getComputedStyle(el);
              if (cs.visibility === "hidden" || +cs.opacity === 0) return false;
              if (el.type === "radio" || el.type === "checkbox") return !el.closest("label"); // the label is the target
              // Inline links in running text are exempt (WCAG 2.5.8)
              const parent = el.parentElement;
              if (el.tagName === "A" && cs.display === "inline" && parent && parent.textContent.trim().length > el.textContent.trim().length + 3) return false;
              return r.width < 24 || r.height < 24;
            })
            .slice(0, 6)
            .map((el) => {
              const r = el.getBoundingClientRect();
              return `${el.tagName}[${(el.getAttribute("aria-label") || el.textContent || el.name || "").trim().slice(0, 30)}] ${Math.round(r.width)}x${Math.round(r.height)}`;
            }),
        );
        if (small.length) out.tap.push({ url, small });
      }
    }
    await ctx.close();
    console.error(`done ${reducedMotion} ${w}`);
  }
}

await browser.close();
const findings = out.overflow.length + out.errors.length + out.hidden.length + out.axe.length + out.tap.length;
console.log(JSON.stringify(out, null, 1));
console.log(`\n${out.pages} pages, ${out.loads} loads: overflow ${out.overflow.length}, errors ${out.errors.length}, hidden ${out.hidden.length}, axe ${out.axe.length}, small targets ${out.tap.length}`);
process.exit(findings ? 1 : 0);
