// Phase QA: screenshots, console errors, horizontal overflow and axe checks.
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = process.env.OUT;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
const report = [];

async function page(width, height, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: opts.reduced ? "reduce" : "no-preference", deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errors = [];
  p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errors.push(`${m.type()}: ${m.text()}`));
  p.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return { ctx, p, errors };
}

async function check(label, url, width, height, fn) {
  const { ctx, p, errors } = await page(width, height);
  await p.goto(BASE + url, { waitUntil: "networkidle" });
  await p.waitForTimeout(2600); // let the intro finish
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await p.screenshot({ path: `${OUT}/${label}.png` });
  if (fn) await fn(p);
  const axe = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  report.push({
    label,
    overflow,
    errors,
    axe: axe.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`),
  });
  await ctx.close();
}

for (const [w, h] of [[375, 812], [768, 1024], [1024, 768], [1440, 900]]) {
  await check(`home-sq-${w}`, "/sq", w, h, async (p) => {
    await p.screenshot({ path: `${OUT}/home-sq-${w}-full.png`, fullPage: true });
  });
}
await check("home-en-375", "/en", 375, 812);
await check("styleguide-375", "/sq/styleguide", 375, 812, async (p) => p.screenshot({ path: `${OUT}/styleguide-375-full.png`, fullPage: true }));
await check("styleguide-1440", "/en/styleguide", 1440, 900, async (p) => p.screenshot({ path: `${OUT}/styleguide-1440-full.png`, fullPage: true }));
await check("404-sq-375", "/sq/nuk-ekziston", 375, 812);
await check("404-en-1440", "/en/does-not-exist", 1440, 900);
for (const [w, h] of [[375, 812], [1024, 768], [1440, 900]]) {
  await check(`shop-sq-${w}`, "/sq/dyqani", w, h, async (p) => p.screenshot({ path: `${OUT}/shop-sq-${w}-full.png`, fullPage: true }));
}
await check("bridal-en-375", "/en/bridal-dresses", 375, 812);
await check("evening-filtered-1440", "/en/evening-dresses?sleeves=long&sort=price-desc", 1440, 900);
await check("new-in-sq-768", "/sq/te-rejat", 768, 1024);

// Collection interactions: filter drawer, load more, URL sync, empty state
{
  const { ctx, p, errors } = await page(375, 812);
  await p.goto(BASE + "/sq/dyqani", { waitUntil: "networkidle" });
  const cards = () => p.locator("main article").count();
  const initial = await cards();
  await p.getByRole("button", { name: /Shfaq më shumë/ }).click();
  await p.waitForTimeout(300);
  const afterMore = await cards();
  const urlAfterMore = p.url();
  await p.getByRole("button", { name: /^Filtro/ }).click();
  await p.waitForTimeout(800);
  await p.getByRole("dialog").getByText("Me mëngë të gjata").click();
  const applyLabel = await p.getByRole("dialog").getByRole("button", { name: /^Shfaq/ }).textContent();
  await p.screenshot({ path: `${OUT}/shop-filter-drawer-375.png` });
  await p.getByRole("dialog").getByRole("button", { name: /^Shfaq/ }).click();
  await p.waitForTimeout(800);
  const filtered = await cards();
  const urlFiltered = p.url();
  await p.goto(BASE + "/sq/dyqani?price=under-500&length=floor", { waitUntil: "networkidle" });
  const emptyShown = await p.getByText("Asnjë fustan nuk përputhet me këto filtra.").isVisible();
  report.push({ label: "collection-interactions-375", errors, initial, afterMore, urlAfterMore, applyLabel, filtered, urlFiltered, emptyShown });
  await ctx.close();
}

// Interactions
{
  const { ctx, p, errors } = await page(375, 812);
  await p.goto(BASE + "/sq", { waitUntil: "networkidle" });
  await p.waitForTimeout(2600);
  await p.getByRole("button", { name: "Hap menynë" }).click();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/menu-375.png` });
  const menuAxe = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa"]).analyze();
  await p.keyboard.press("Escape");
  await p.waitForTimeout(500);
  await p.getByRole("button", { name: /Shporta/ }).click();
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/cart-375.png` });
  await p.keyboard.press("Escape");
  await p.waitForTimeout(500);
  await p.mouse.wheel(0, 1400);
  await p.waitForTimeout(800);
  await p.mouse.wheel(0, -300);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/header-scrolled-375.png` });
  // Newsletter validation
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(800);
  const email = p.getByLabel("Adresa e email-it");
  await email.fill("jo-email");
  await email.blur();
  await p.waitForTimeout(300);
  const inlineError = await p.locator("#" + (await email.getAttribute("id")) + "-error").textContent();
  await email.fill("emri@shembull.com");
  await p.getByRole("button", { name: "Abonohu" }).click();
  await p.locator(".toast").first().waitFor({ timeout: 10000 }).catch(() => {});
  await p.screenshot({ path: `${OUT}/newsletter-375.png` });
  const toastText = await p.locator(".toast").first().textContent().catch(() => null);
  report.push({ label: "interactions-375", errors, menuAxe: menuAxe.violations.map((v) => v.id), inlineError, toastText });
  await ctx.close();
}
{
  const { ctx, p, errors } = await page(1440, 900);
  await p.goto(BASE + "/en", { waitUntil: "networkidle" });
  await p.waitForTimeout(2600);
  await p.mouse.wheel(0, 900);
  await p.waitForTimeout(900);
  await p.mouse.wheel(0, -200);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/header-scrolled-1440.png` });
  // Language switch keeps the page
  await p.goto(BASE + "/en/styleguide", { waitUntil: "networkidle" });
  await p.getByRole("link", { name: "Shqip" }).first().click();
  await p.waitForURL(/\/sq\/styleguide/);
  // Keyboard: first tab reaches skip link
  await p.keyboard.press("Tab");
  const focused = await p.evaluate(() => document.activeElement?.textContent);
  report.push({ label: "interactions-1440", errors, langSwitchUrl: p.url(), firstTab: focused });
  await ctx.close();
}
{
  const { ctx, p, errors } = await page(375, 812, { reduced: true });
  await p.goto(BASE + "/sq", { waitUntil: "networkidle" });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/home-reduced-375.png` });
  const introVisible = await p.locator(".intro").isVisible();
  report.push({ label: "reduced-motion", errors, introVisible });
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
