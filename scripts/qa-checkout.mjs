// Phase 4 QA: checkout, offline + card (sandbox) orders, confirmation, proof upload, emails.
// Needs a server without Supabase service credentials (local order store + email outbox).
// Usage: BASE=... OUT=... node scripts/qa-checkout.mjs
import { readdir, writeFile } from "node:fs/promises";
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

const measurements = [
  ["height", 168], ["bust", 88], ["underbust", 76], ["waist", 70], ["hips", 96],
  ["shoulder_width", 38], ["hollow_to_floor", 140], ["heel_height", 0], ["bicep", 27], ["sleeve_length", 58], ["wrist", 15],
].map(([id, cm]) => ({ id, cm, label: { sq: id, en: id } }));

const cart = (lines) => JSON.stringify({ state: { lines }, version: 2 });
const lines = [
  { key: "nata-M", productId: "nata", slug: "nata", name: "Nata", priceEUR: 690, quantity: 1, size: "M", color: "E zezë", colorHex: "#1E1B1A" },
  { key: "nata-custom", productId: "nata", slug: "nata", name: "Nata", priceEUR: 690, quantity: 1, size: "custom", color: "Bordo", colorHex: "#5C1F2B", measurements, unit: "cm", notes: "Dasma më 12 qershor" },
];

async function newPage(width, cartLines) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  await ctx.addInitScript((value) => {
    if (!sessionStorage.getItem("jf-qa-seeded")) {
      localStorage.setItem("jf-cart", value);
      localStorage.setItem("jf-intro-seen", "1");
      sessionStorage.setItem("jf-qa-seeded", "1");
    }
  }, cart(cartLines));
  const p = await ctx.newPage();
  p.errors = [];
  p.on("console", (m) => m.type() === "error" && !/OuterLayoutRouter|404/.test(m.text()) && p.errors.push(m.text().slice(0, 200)));
  p.on("pageerror", (e) => p.errors.push("pageerror " + e.message));
  return p;
}

async function fillContactAndAddress(p, { country = "XK", phone = "044 123 456", city = "Prishtinë" } = {}) {
  await p.fill("#checkout-email", "qa@example.com");
  await p.selectOption("#checkout-shipping-country", country);
  await p.fill("#checkout-phone", phone);
  await p.fill("#checkout-shipping-firstName", "Arta");
  await p.fill("#checkout-shipping-lastName", "Krasniqi");
  await p.fill("#checkout-shipping-line1", "Rruga e Dëshmorëve 12");
  await p.fill("#checkout-shipping-city", city);
}

// 1. Mobile: validation, discount, bank transfer order
{
  const p = await newPage(375, lines);
  await p.goto(BASE + "/sq/pagesa", { waitUntil: "networkidle" });
  await p.waitForSelector("#checkout-email");
  report.overflow375 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await p.screenshot({ path: `${OUT}/p4-checkout-375.png` });
  await p.screenshot({ path: `${OUT}/p4-checkout-375-full.png`, fullPage: true });
  await axe(p, "checkout-375");

  // Empty submit → error summary
  await p.getByRole("button", { name: /Bëj porosinë|Paguaj tani/ }).click();
  await p.waitForTimeout(400);
  report.errorSummary = (await p.locator('[role="alert"]').first().textContent())?.slice(0, 160);
  await p.screenshot({ path: `${OUT}/p4-checkout-errors-375.png` });

  // Summary bar + discount
  await p.getByRole("button", { name: /Shfaq përmbledhjen/ }).click();
  await p.waitForTimeout(500);
  await p.locator("#checkout-summary-mobile input").fill("nuk-ekziston");
  await p.locator("#checkout-summary-mobile").getByRole("button", { name: "Zbato" }).click();
  await p.waitForTimeout(800);
  report.discountInvalid = await p.locator("#checkout-summary-mobile [role=alert]").textContent();
  await p.locator("#checkout-summary-mobile input").fill("miresevini10");
  await p.locator("#checkout-summary-mobile").getByRole("button", { name: "Zbato" }).click();
  await p.waitForTimeout(800);
  report.discountApplied = await p.locator("#checkout-summary-mobile [role=status]").textContent();
  await p.locator("#checkout-summary-mobile").getByRole("button", { name: "Shiko masat" }).click();
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/p4-measurements-drawer-375.png` });
  await p.keyboard.press("Escape");
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/p4-summary-open-375.png` });

  await fillContactAndAddress(p, { phone: "123" });
  await p.getByText("Transfertë bankare", { exact: true }).click();
  await p.locator("#checkout-terms").check();
  await p.getByRole("button", { name: "Bëj porosinë" }).click();
  await p.waitForTimeout(400);
  report.phoneError = await p.locator("#checkout-phone-error").textContent();
  await p.fill("#checkout-phone", "044 123 456");
  report.totalBeforeOrder = await p.locator("form dl").last().locator("dd").last().textContent();
  await p.getByRole("button", { name: "Bëj porosinë" }).click();
  await p.waitForURL(/\/sq\/porosia\//, { timeout: 20000 });
  await p.waitForLoadState("networkidle");
  report.bankOrderUrl = p.url().replace(BASE, "");
  report.bankOrderHeading = await p.locator("h1").textContent();
  report.bankStatus = await p.locator("main .label, main [class*=border-gold-ink]").allTextContents();
  await p.screenshot({ path: `${OUT}/p4-order-bank-375.png`, fullPage: true });
  await axe(p, "order-bank-375");
  report.cartAfterOrder = await p.evaluate(() => JSON.parse(localStorage.getItem("jf-cart") ?? "{}").state?.lines?.length);

  // Proof upload (tiny PNG)
  const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4c50000000049454e44ae426082", "hex");
  await p.locator('#proof input[type="file"]').setInputFiles({ name: "fatura.png", mimeType: "image/png", buffer: png });
  await p.locator("#proof").getByLabel(/Referenca/).fill("TRX-5521");
  await p.getByRole("button", { name: "Dërgo dëshminë" }).click();
  await p.waitForTimeout(2000);
  report.proofSent = await p.locator("#proof [role=status]").textContent().catch(() => null);
  report.proofListed = await p.locator("#proof ul").textContent().catch(() => null);
  // Fake PDF (wrong magic bytes) is rejected
  await p.locator('#proof input[type="file"]').setInputFiles({ name: "fake.pdf", mimeType: "application/pdf", buffer: Buffer.from("not a pdf") });
  await p.getByRole("button", { name: "Dërgo dëshminë" }).click();
  await p.waitForTimeout(1500);
  report.fakeFileError = await p.locator("#proof [role=alert]").allTextContents();
  report.errors375 = p.errors;
  await p.context().close();
}

// 2. Desktop, English: card via local Paysera sandbox, cancel then pay
{
  const p = await newPage(1440, [lines[0]]);
  await p.goto(BASE + "/en/checkout", { waitUntil: "networkidle" });
  await p.waitForSelector("#checkout-email");
  report.overflow1440 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await p.screenshot({ path: `${OUT}/p4-checkout-1440.png` });
  await axe(p, "checkout-1440");
  await fillContactAndAddress(p, { country: "DE", phone: "030 12345678", city: "Berlin" });
  report.deRates = await p.locator('input[name="shippingRateId"]').count();
  await p.getByText("Express", { exact: true }).click();
  await p.getByText("Card", { exact: true }).click();
  await p.locator("#checkout-terms").check();
  report.cardButton = await p.locator("form[novalidate].mt-8 button[type=submit]").last().textContent();
  await p.screenshot({ path: `${OUT}/p4-checkout-filled-1440.png`, fullPage: true });
  await p.getByRole("button", { name: "Pay now" }).click();
  await p.waitForURL(/paysera\/sandbox/, { timeout: 20000 });
  report.sandboxTitle = await p.locator("h1").textContent();
  await p.getByRole("button", { name: "Cancel payment" }).click();
  await p.waitForURL(/payment=cancelled/);
  await p.waitForLoadState("networkidle");
  report.cancelledText = await p.locator("[role=status]").first().textContent();
  await p.screenshot({ path: `${OUT}/p4-order-cancelled-1440.png` });
  await p.getByRole("button", { name: "Try the payment again" }).click();
  await p.waitForURL(/paysera\/sandbox/);
  await p.getByRole("button", { name: "Simulate successful payment" }).click();
  await p.waitForURL(/\/en\/order\//);
  await p.waitForLoadState("networkidle");
  report.paidStatus = await p.getByText("Payment received").count();
  await p.screenshot({ path: `${OUT}/p4-order-paid-1440.png`, fullPage: true });
  await axe(p, "order-paid-1440");
  report.errors1440 = p.errors;
  await p.context().close();
}

// 3. Tampered cart: wrong price is corrected by the server
{
  const p = await newPage(375, [{ ...lines[0], priceEUR: 1 }]);
  await p.goto(BASE + "/sq/pagesa", { waitUntil: "networkidle" });
  await p.waitForSelector("#checkout-email");
  await fillContactAndAddress(p);
  await p.getByText("Wise", { exact: true }).click();
  await p.locator("#checkout-terms").check();
  await p.getByRole("button", { name: "Bëj porosinë" }).click();
  await p.waitForTimeout(2500);
  report.tamperedMessage = await p.locator("form > [role=alert]").first().textContent().catch(() => null);
  report.tamperedPriceNow = await p.evaluate(() => JSON.parse(localStorage.getItem("jf-cart")).state.lines[0].priceEUR);
  await p.context().close();
}

report.outbox = (await readdir(".data/emails").catch(() => [])).map((f) => f.replace(/^.*?Z?-\d+Z-/, ""));
await browser.close();
await writeFile(`${OUT}/p4-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
