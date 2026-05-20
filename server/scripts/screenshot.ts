/**
 * Take showcase screenshots for README.
 *
 * Usage:
 *   1. Start the dev server: npm run dev (+ cd ../web && npx vite)
 *   2. Run: npx tsx scripts/screenshot.ts
 *
 * Output: ../screenshots/*.png
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../../screenshots");
mkdirSync(OUT_DIR, { recursive: true });

const BASE = process.env.BASE_URL || "http://localhost:5173";

const pages = [
  { name: "daily", path: "/", waitFor: 1500 },
  { name: "browse", path: "/browse", waitFor: 1500 },
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});

for (const pg of pages) {
  const page = await context.newPage();
  await page.goto(`${BASE}${pg.path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(pg.waitFor);
  const out = resolve(OUT_DIR, `${pg.name}.png`);
  await page.screenshot({ path: out });
  console.log(`✓ ${pg.name} → ${out}`);
  await page.close();
}

await browser.close();
console.log(`\nDone — ${pages.length} screenshots in ${OUT_DIR}`);
