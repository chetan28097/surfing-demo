// Visual + behavioural inspection with Playwright.
//   node scripts/inspect.mjs [baseUrl] [outDir] [desktop|mobile|all]
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? "http://localhost:3210";
const out = process.argv[3] ?? "inspect-shots";
const which = process.argv[4] ?? "all";
fs.mkdirSync(out, { recursive: true });

const viewports = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const browser = await chromium.launch({
  args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-unsafe-swiftshader"],
});

for (const [name, vp] of Object.entries(viewports)) {
  if (which !== "all" && which !== name) continue;
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
  const page = await ctx.newPage();
  const logs = [];
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && logs.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const ready = await page.evaluate(() => document.querySelector(".scene-layer__canvas")?.getAttribute("data-ready"));
  const fallback = await page.evaluate(() => !!document.querySelector(".scene-layer__fallback"));
  console.log(`[${name}] canvas ready=${ready} fallback=${fallback}`);

  // Positions: journey progress fractions, then section anchors.
  const stops = await page.evaluate(() => {
    const top = (sel) => document.querySelector(sel).getBoundingClientRect().top + scrollY;
    const j = document.querySelector("#top");
    const jStart = top("#top");
    const jLen = j.offsetHeight - innerHeight;
    const f = document.querySelector("#finale");
    const fStart = top("#finale") - innerHeight;
    const fLen = f.offsetHeight;
    const g = top("#gallery");
    return [
      ["01-hero", jStart],
      ["02-dive-20", jStart + jLen * 0.2],
      ["03-dive-40", jStart + jLen * 0.4],
      ["04-dive-55", jStart + jLen * 0.55],
      ["05-dive-75", jStart + jLen * 0.75],
      ["06-dive-95", jStart + jLen * 0.95],
      ["07-school", top("#school") + innerHeight * 0.2],
      ["08-school-mid", top("#school") + document.querySelector("#school").offsetHeight * 0.45],
      ["09-school-loc", top("#school") + document.querySelector("#school").offsetHeight * 0.82],
      ["10-lessons", top("#lessons") + innerHeight * 0.25],
      ["11-lessons-rows", top("#lessons") + innerHeight * 0.9],
      ["12-gallery", g + 2],
      ["13-gallery-mid", g + innerWidth * 0.9],
      ["14-finale-20", fStart + fLen * 0.2],
      ["15-finale-55", fStart + fLen * 0.55],
      ["16-finale-end", document.documentElement.scrollHeight],
    ];
  });

  for (const [label, y] of stops) {
    // Step there so scrubbed timelines and pins see intermediate positions.
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(label.startsWith("0") && label !== "01-hero" ? 1800 : 1400);
    await page.screenshot({ path: path.join(out, `${name}-${label}.jpg`), type: "jpeg", quality: 70 });
  }

  // Interaction checks: lesson row toggle, booking dialog validation + submit.
  await page.evaluate(() => window.scrollTo(0, document.querySelector("#lessons").offsetTop));
  await page.waitForTimeout(800);
  const row = page.locator("#lessons button[aria-expanded]").nth(1);
  await row.click();
  await page.waitForTimeout(700);
  console.log(`[${name}] lesson row 2 expanded=${await row.getAttribute("aria-expanded")}`);
  await page.screenshot({ path: path.join(out, `${name}-17-lesson-open.jpg`), type: "jpeg", quality: 70 });

  await page.locator("#lessons").getByRole("button", { name: /^Book finding/i }).click();
  await page.waitForTimeout(600);
  const dialogOpen = await page.evaluate(() => document.querySelector("dialog")?.open);
  const selected = await page.evaluate(() => document.querySelector("dialog select")?.value);
  console.log(`[${name}] dialog open=${dialogOpen} preselected=${selected}`);
  await page.getByRole("button", { name: "Send request" }).click();
  await page.waitForTimeout(300);
  const errs = await page.locator(".field__error").allTextContents();
  console.log(`[${name}] validation errors shown: ${errs.length} (${errs.join(" | ")})`);
  await page.screenshot({ path: path.join(out, `${name}-18-dialog-errors.jpg`), type: "jpeg", quality: 70 });

  const d = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  await page.fill("dialog input[name=date]", d);
  await page.fill("dialog input[name=name]", "Test Surfer");
  await page.fill("dialog input[name=email]", "test@example.com");
  await page.getByRole("button", { name: "Send request" }).click();
  await page.waitForSelector("dialog [role=status]", { timeout: 5000 }).catch(() => {});
  console.log(`[${name}] submit result: ${(await page.locator("dialog [role=status]").textContent().catch(() => "none"))?.slice(0, 90)}`);
  await page.screenshot({ path: path.join(out, `${name}-19-dialog-sent.jpg`), type: "jpeg", quality: 70 });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  console.log(`[${name}] dialog closed with Esc=${!(await page.evaluate(() => document.querySelector("dialog")?.open))}`);

  // Nav link → section + focus
  if (name === "desktop") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.getByRole("navigation", { name: "Main" }).first().getByRole("link", { name: "Gallery" }).click();
    await page.waitForTimeout(2600);
    const nav = await page.evaluate(() => ({ focus: document.activeElement?.id, top: Math.round(document.querySelector("#gallery").getBoundingClientRect().top) }));
    console.log(`[${name}] nav→gallery focus=${nav.focus} sectionTop=${nav.top}`);
  }

  const st = await page.evaluate(() => window.__stCount?.() ?? null);
  if (st !== null) console.log(`[${name}] ScrollTriggers: ${st}`);
  console.log(`[${name}] console issues (${logs.length}):\n  ${[...new Set(logs)].slice(0, 15).join("\n  ")}`);
  await ctx.close();
}

await browser.close();
