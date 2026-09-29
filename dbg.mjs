import { chromium } from "@playwright/test";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await p.goto("http://localhost:3100/en/styleguide", { waitUntil: "networkidle" });
const el = p.getByRole("heading", { name: "Measurement illustrations" }).locator("..");
await el.scrollIntoViewIfNeeded();
await p.waitForTimeout(3000);
await el.screenshot({ path: "/tmp/claude-0/-home-user-jelafashion/20be4f5c-9e0e-5b51-bcc0-62ab00126a79/scratchpad/shots/figures.png" });
await b.close();
