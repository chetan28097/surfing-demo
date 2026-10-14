// Reduced-motion pass: no WebGL, no Lenis, all content visible and in order.
import { chromium } from "@playwright/test";
const [base = "http://localhost:3210", out = "."] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(base, { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
const r = await p.evaluate(() => ({
  canvas: !!document.querySelector("canvas"),
  fallback: !!document.querySelector(".scene-layer__fallback"),
  lenis: document.documentElement.classList.contains("lenis"),
  hiddenBeats: [...document.querySelectorAll("[data-beat]")].filter((el) => getComputedStyle(el).visibility === "hidden").length,
}));
console.log("reduced:", JSON.stringify(r), "errors:", errs.length);
for (const [label, sel] of [["hero", "#top"], ["school", "#school"], ["gallery", "#gallery"], ["finale", "#contact"]]) {
  await p.evaluate((s) => document.querySelector(s).scrollIntoView(), sel);
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/reduced-${label}.jpg`, type: "jpeg", quality: 65 });
}
// Keyboard: tab from the top reaches skip link first, then the header.
await p.evaluate(() => scrollTo(0, 0));
await p.keyboard.press("Tab");
console.log("first tab stop:", await p.evaluate(() => document.activeElement?.textContent?.trim()));
await b.close();
