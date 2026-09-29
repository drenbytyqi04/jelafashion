// Phase 3 QA: product page, cart, measurement wizard. Usage: BASE=... OUT=... node scripts/qa-product.mjs
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = process.env.OUT ?? ".";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
const report = {};
const axe = async (p, label) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  report[`axe:${label}`] = r.violations.map((v) => `${v.id} (${v.impact}) ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
};

const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => m.type() === "error" && !/OuterLayoutRouter|404/.test(m.text()) && errors.push(m.text().slice(0, 200)));
p.on("pageerror", (e) => errors.push("pageerror " + e.message));

await p.goto(BASE + "/sq/fustan/drita", { waitUntil: "networkidle" });
report.overflow375 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
await p.screenshot({ path: `${OUT}/p3-product-375.png` });
await p.screenshot({ path: `${OUT}/p3-product-375-full.png`, fullPage: true });
await axe(p, "product-375");

// No size chosen
await p.getByRole("button", { name: "Shto në shportë" }).first().click();
report.noSizeError = await p.locator("#size-error").textContent();

// Standard size
await p.locator('label:has(input[value="M"])').click();
await p.getByRole("button", { name: "Shto në shportë" }).first().click();
await p.waitForTimeout(1200);
report.drawerAfterStandard = await p.getByRole("dialog").getByRole("heading").first().textContent();
await p.screenshot({ path: `${OUT}/p3-cart-drawer-375.png` });
await p.keyboard.press("Escape");
await p.waitForTimeout(600);

// Size guide
await p.getByRole("button", { name: "Udhëzuesi i masave" }).click();
await p.waitForTimeout(700);
await p.getByText("inç", { exact: true }).click();
report.sizeGuideFirstBust = await p.locator("tbody tr").first().locator("td").nth(1).textContent();
await p.screenshot({ path: `${OUT}/p3-size-guide-375.png` });
await p.keyboard.press("Escape");
await p.waitForTimeout(600);

// Custom size → wizard
await p.locator('label:has(input[value="custom"])').click();
report.ctaCustom = await p.locator("div.grid button").filter({ hasText: /masat/ }).first().textContent();
await p.getByRole("button", { name: "Shëno masat e tua" }).first().click();
await p.waitForTimeout(900);
await p.screenshot({ path: `${OUT}/p3-wizard-intro-375.png` });
await axe(p, "wizard-intro");
await p.getByRole("button", { name: "Fillo" }).click();
await p.waitForTimeout(700);

const values = { height: "168", bust: "88", underbust: "92", waist: "70", hips: "96", shoulder_width: "38", hollow_to_floor: "140", heel_height: "8", neck: "34", bicep: "27", sleeve_length: "58", wrist: "15" };
const steps = [];
for (let i = 0; i < 20; i++) {
  const label = await p.locator("#wizard-input").getAttribute("aria-label").catch(() => null);
  if (!label) break;
  const stepText = await p.getByText(/^Hapi \d+ nga \d+$/).textContent();
  steps.push(stepText);
  if (i === 0) {
    // out of range, then back button test after step 2
    await p.fill("#wizard-input", "320");
    await p.keyboard.press("Enter");
    report.rangeError = await p.locator("#wizard-error").textContent();
    await p.screenshot({ path: `${OUT}/p3-wizard-step-error-375.png` });
  }
  const id = Object.keys(values)[i];
  await p.fill("#wizard-input", values[id]);
  await p.keyboard.press("Enter");
  await p.waitForTimeout(550);
  if (id === "underbust") {
    report.warning = await p.locator("#wizard-warning").textContent().catch(() => null);
    await p.screenshot({ path: `${OUT}/p3-wizard-warning-375.png` });
    await p.getByRole("button", { name: "Kontrollo sërish" }).click();
    await p.fill("#wizard-input", "76");
    await p.keyboard.press("Enter");
    await p.waitForTimeout(550);
  }
  if (i === 2) {
    // Browser back goes one step back, not off the page
    await p.goBack();
    await p.waitForTimeout(700);
    report.afterBack = await p.getByText(/^Hapi \d+ nga \d+$/).textContent();
    report.urlAfterBack = p.url();
    await p.keyboard.press("Enter");
    await p.waitForTimeout(550);
  }
  if (i === 4) await p.screenshot({ path: `${OUT}/p3-wizard-step-375.png` });
}
report.steps = steps;
await p.screenshot({ path: `${OUT}/p3-wizard-summary-375.png` });
await axe(p, "wizard-summary");
await p.getByLabel(/Shënime për atelenë/).fill("Ceremonia më 12 qershor.");
await p.getByRole("button", { name: "Konfirmo dhe shto në shportë" }).click();
await p.waitForTimeout(1600);
await p.screenshot({ path: `${OUT}/p3-cart-after-custom-375.png` });
report.cartLines = await p.evaluate(() => JSON.parse(localStorage.getItem("jf-cart") || "{}").state?.lines?.map((l) => ({ size: l.size, n: l.measurements?.length, notes: l.notes, unit: l.unit })));
report.savedMeasurements = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("jf-measurements") || "{}").state?.values ?? {}).length);
await p.keyboard.press("Escape");
await p.waitForTimeout(500);

// Lightbox
await p.getByRole("button", { name: /Hap fotografinë 1/ }).first().click();
await p.waitForTimeout(700);
report.lightboxOpen = await p.getByRole("dialog").isVisible();
await p.keyboard.press("Escape");

// Sticky bar
await p.evaluate(() => window.scrollTo(0, 1400));
await p.waitForTimeout(900);
report.stickyVisible = await p.evaluate(() => {
  const bar = [...document.querySelectorAll("div.fixed.bottom-0")].find((d) => d.textContent.includes("Drita"));
  return bar ? getComputedStyle(bar).transform : null;
});
await p.screenshot({ path: `${OUT}/p3-sticky-375.png` });

// Cart page
await p.goto(BASE + "/sq/shporta", { waitUntil: "networkidle" });
await p.waitForTimeout(500);
await p.getByRole("button", { name: "Shiko masat" }).click();
await p.screenshot({ path: `${OUT}/p3-cart-page-375.png`, fullPage: true });
report.overflowCart = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
await axe(p, "cart-375");

// Desktop product
const d = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
d.on("pageerror", (e) => errors.push("pageerror(d) " + e.message));
await d.goto(BASE + "/en/dress/nata", { waitUntil: "networkidle" });
await d.screenshot({ path: `${OUT}/p3-product-1440.png` });
await d.screenshot({ path: `${OUT}/p3-product-1440-full.png`, fullPage: true });
report.overflow1440 = await d.evaluate(() => document.documentElement.scrollWidth - innerWidth);
await axe(d, "product-1440");
await d.locator('label:has(input[value="custom"])').click();
await d.getByRole("button", { name: "Enter your measurements" }).first().click();
await d.waitForTimeout(900);
await d.getByRole("button", { name: "Inches" }).click().catch(() => d.getByText("Inches").click());
await d.getByRole("button", { name: "Start" }).click();
await d.waitForTimeout(700);
await d.fill("#wizard-input", "90");
await d.keyboard.press("Enter");
report.inchRange = await d.locator("#wizard-error").textContent();
await d.screenshot({ path: `${OUT}/p3-wizard-1440.png` });

report.errors = errors;
await browser.close();
console.log(JSON.stringify(report, null, 2));
