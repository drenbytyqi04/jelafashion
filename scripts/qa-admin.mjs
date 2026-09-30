// Phase 5 QA: accounts and admin panel against the local development database.
// Needs a server without Supabase secrets (dev, or JF_LOCAL_DATA=1 npm start).
// Usage: BASE=... OUT=... node scripts/qa-admin.mjs
import { readdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = process.env.OUT ?? ".";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
const report = {};
const errors = [];
const axe = async (p, label) => {
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  report[`axe:${label}`] = r.violations.map((v) => `${v.id} (${v.impact}) ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
};
const db = async () => JSON.parse(await readFile(".data/db.json", "utf8"));
const outbox = async () => (await readdir(".data/emails").catch(() => [])).sort();

async function context(width, cart) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  // Cookie choice already made: these suites test buying, not the banner (qa.mjs covers it).
  await ctx.addInitScript(() => {
    if (!localStorage.getItem("jf-consent"))
      localStorage.setItem("jf-consent", JSON.stringify({ state: { analytics: false, marketing: false, decidedAt: "2026-01-01T00:00:00.000Z" }, version: 1 }));
  });
  if (cart) {
    await ctx.addInitScript((value) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("jf-cart", value);
        sessionStorage.setItem("seeded", "1");
      }
    }, JSON.stringify({ state: { lines: cart }, version: 2 }));
  }
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`${width}: ${e.message}`));
  p.on("console", (m) => m.type() === "error" && !/OuterLayoutRouter|404|Failed to load resource/.test(m.text()) && errors.push(`${width}: ${m.text().slice(0, 160)}`));
  return p;
}

async function signIn(p, email, startPath, buttonName) {
  await p.goto(BASE + startPath, { waitUntil: "networkidle" });
  await p.fill("#signin-email", email);
  const before = await outbox();
  await p.getByRole("button", { name: buttonName }).click();
  await p.waitForSelector("[role=status]");
  const fresh = (await outbox()).filter((f) => !before.includes(f) && f.includes("sign-in"));
  const html = await readFile(".data/emails/" + fresh.at(-1), "utf8");
  const link = html.match(/href="(http[^"]*auth\/callback[^"]*)"/)[1].replace(/&amp;/g, "&");
  await p.goto(link, { waitUntil: "networkidle" });
}

const measurements = [["height", 168], ["bust", 88], ["underbust", 76], ["waist", 70], ["hips", 96], ["shoulder_width", 38], ["hollow_to_floor", 140], ["heel_height", 8], ["bicep", 27], ["sleeve_length", 58], ["wrist", 15]].map(([id, cm]) => ({ id, cm }));
const cart = [
  { key: "nata-M", productId: "nata", slug: "nata", name: "Nata", priceEUR: 690, quantity: 2, size: "M", color: "E zezë", colorHex: "#1E1B1A" },
  { key: "nata-c", productId: "nata", slug: "nata", name: "Nata", priceEUR: 690, quantity: 1, size: "custom", color: "Bordo", colorHex: "#5C1F2B", measurements, unit: "cm", notes: "Dasma në qershor" },
];
const stockOf = async () => (await db()).products.find((p) => p.slug === "nata").sizes.find((s) => s.size === "M").stock;

// 1. Guest order (bank transfer) takes stock. The local database is created on first
// write; until then stock is the sample data's (Nata M: 3).
const stockBefore = await stockOf().catch(() => 3);
{
  const p = await context(375, cart);
  await p.goto(BASE + "/sq/pagesa", { waitUntil: "networkidle" });
  await p.waitForSelector("#checkout-email");
  await p.fill("#checkout-email", "blerta@example.com");
  await p.fill("#checkout-phone", "044 123 456");
  await p.fill("#checkout-shipping-firstName", "Blerta");
  await p.fill("#checkout-shipping-lastName", "Gashi");
  await p.fill("#checkout-shipping-line1", "Rruga e Shadërvanit 3");
  await p.fill("#checkout-shipping-city", "Prizren");
  await p.getByText("Transfertë bankare", { exact: true }).click();
  await p.locator("#checkout-terms").check();
  await p.getByRole("button", { name: "Bëj porosinë" }).click();
  await p.waitForURL(/porosia/, { timeout: 20000 });
  await p.context().close();
}
report.stock = { before: stockBefore, afterOrder: await stockOf() };
const order = (await db()).orders.at(-1);
report.order = order.number;

// 2. Non-admin can't open the panel
{
  const p = await context(1440);
  await signIn(p, "blerta@example.com", "/sq/llogaria", "Më dërgo lidhjen");
  report.customerSeesGuestOrder = await p.getByText(order.number).count();
  await p.screenshot({ path: `${OUT}/p5-account-orders-375.png`, fullPage: true });
  await p.goto(BASE + "/admin", { waitUntil: "networkidle" });
  report.customerAdminRedirect = p.url().replace(BASE, "");
  const proof = await p.request.get(`${BASE}/admin/proofs/${order.id}/0`);
  const csv = await p.request.get(`${BASE}/admin/orders/export`);
  report.customerProtectedStatuses = [proof.status(), csv.status()];
  await p.context().close();
}

// 3. Admin
const p = await context(1440);
await signIn(p, "admin@example.com", "/admin/login", "Më dërgo lidhjen");
report.adminLanding = p.url().replace(BASE, "");
await p.screenshot({ path: `${OUT}/p5-admin-dashboard-1440.png` });
await axe(p, "admin-dashboard");

await p.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
await p.screenshot({ path: `${OUT}/p5-admin-orders-1440.png` });
await axe(p, "admin-orders");
await p.getByRole("link", { name: order.number }).first().click();
await p.waitForURL(/admin\/orders\//);
await p.screenshot({ path: `${OUT}/p5-admin-order-1440.png`, fullPage: true });
await axe(p, "admin-order");

async function move(button, fill) {
  await p.getByRole("button", { name: button }).click();
  await p.waitForSelector("#status-form");
  if (fill) await fill();
  await p.getByRole("button", { name: "Konfirmo" }).click();
  await p.waitForTimeout(1500);
  return (await p.locator("h1 span").last().textContent())?.trim();
}
report.flow = [];
report.flow.push(await move("Shëno si të paguar", () => p.fill("#reference", "TRX-777")));
report.flow.push(await move("Fillo punën"));
// Shipping without tracking is refused
await p.getByRole("button", { name: "Shëno si të nisur" }).click();
await p.getByRole("button", { name: "Konfirmo" }).click();
await p.waitForTimeout(800);
report.shipWithoutTracking = await p.locator("#status-form [role=alert]").textContent().catch(() => null);
await p.fill("#tracking", "JJD000123");
await p.fill("#carrier", "DHL");
await p.getByRole("button", { name: "Konfirmo" }).click();
await p.waitForTimeout(1500);
report.flow.push((await p.locator("h1 span").last().textContent())?.trim());
report.statusEmails = (await outbox()).filter((f) => /order-(paid|in_production|shipped)/.test(f)).map((f) => f.replace(/^.*Z-/, ""));

// Print sheet
await p.goto(`${BASE}/admin/print/${order.id}`, { waitUntil: "networkidle" });
report.sheetRows = await p.locator("tbody tr").count();
await p.pdf?.({ path: `${OUT}/p5-measurement-sheet.pdf`, format: "A4" }).catch(() => undefined);
await p.screenshot({ path: `${OUT}/p5-measurement-sheet.png`, fullPage: true });

// CSV
const csv = await p.request.get(`${BASE}/admin/orders/export`);
const csvText = await csv.text();
report.csv = { status: csv.status(), header: csvText.split("\r\n")[0].slice(1, 60), rows: csvText.split("\r\n").length - 1 };

// New product with a photo
await p.goto(`${BASE}/admin/products/new`, { waitUntil: "networkidle" });
const photo = await p.screenshot({ clip: { x: 0, y: 0, width: 300, height: 400 } });
await p.fill("#nameSq", "Mëngjesi");
await p.fill("#nameEn", "Morning");
await p.fill("#price", "980");
await p.fill("#dSq", "Tyl i butë dhe dantellë, për një ceremoni në mëngjes.");
await p.getByRole("button", { name: "Shto ngjyrë" }).click();
await p.fill("#c0sq", "Fildish");
await p.fill("#c0en", "Ivory");
await p.locator("#product-images").setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: photo });
await p.waitForSelector("img[src*='local-media']", { timeout: 15000 });
await p.getByLabel("Publikuar (shfaqet në faqe)").check();
await p.getByRole("button", { name: "Ruaj produktin" }).click();
await p.waitForURL(/admin\/products\/[0-9a-f-]{36}/, { timeout: 15000 });
report.productSaved = p.url().replace(BASE, "");
await p.screenshot({ path: `${OUT}/p5-admin-product-1440.png`, fullPage: true });
await axe(p, "admin-product");

// Homepage marquee
await p.goto(`${BASE}/admin/homepage`, { waitUntil: "networkidle" });
await p.fill("#msq", "Punuar me dorë në Prizren\nQA fraza e re");
await p.getByRole("button", { name: "Ruaj faqen kryesore" }).click();
await p.waitForTimeout(1500);

// Discount
await p.goto(`${BASE}/admin/discounts`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Shto kod" }).click();
await p.fill("#dcode", "vera25");
await p.fill("#dval", "25");
await p.getByRole("button", { name: "Ruaj", exact: true }).click();
await p.waitForTimeout(1500);
report.discounts = await p.locator("tbody tr td:first-child").allTextContents();

// Other pages render
for (const path of ["collections", "shipping", "payments", "customers", "newsletter"]) {
  await p.goto(`${BASE}/admin/${path}`, { waitUntil: "networkidle" });
  report[`page:${path}`] = await p.locator("h1").textContent();
}
await axe(p, "admin-newsletter");

// Mobile admin
const m = await context(375);
await m.context().addCookies(await p.context().cookies());
await m.goto(`${BASE}/admin/orders/${order.id}`, { waitUntil: "networkidle" });
report.adminOverflow375 = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth);
await m.screenshot({ path: `${OUT}/p5-admin-order-375.png`, fullPage: true });

// Shop reflects admin edits
const shop = await context(1440);
await shop.goto(`${BASE}/sq/fustan/mengjesi`, { waitUntil: "networkidle" });
report.newProductOnShop = await shop.locator("h1").textContent().catch(() => null);
report.newProductImage = await shop.locator("img[src*='local-media'], img[srcset*='local-media']").count();
await shop.goto(`${BASE}/sq`, { waitUntil: "networkidle" });
report.marqueeOnHome = await shop.getByText("QA fraza e re").count();

// Cancellation returns stock (second order)
{
  const c = await context(375, [{ ...cart[0], quantity: 1 }]);
  await c.goto(BASE + "/sq/pagesa", { waitUntil: "networkidle" });
  await c.waitForSelector("#checkout-email");
  await c.fill("#checkout-email", "dita@example.com");
  await c.fill("#checkout-phone", "044 555 666");
  await c.fill("#checkout-shipping-firstName", "Dita");
  await c.fill("#checkout-shipping-lastName", "Berisha");
  await c.fill("#checkout-shipping-line1", "Rruga 1");
  await c.fill("#checkout-shipping-city", "Prishtinë");
  await c.getByText("Wise", { exact: true }).click();
  await c.locator("#checkout-terms").check();
  await c.getByRole("button", { name: "Bëj porosinë" }).click();
  await c.waitForURL(/porosia/, { timeout: 20000 });
}
report.stock.afterSecondOrder = await stockOf();
const second = (await db()).orders.at(-1);
await p.goto(`${BASE}/admin/orders/${second.id}`, { waitUntil: "networkidle" });
await move("Anulo porosinë");
report.stock.afterCancel = await stockOf();

report.errors = errors;
await browser.close();
await writeFile(`${OUT}/p5-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
