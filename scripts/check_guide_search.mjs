import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { createPlantSearch } from "../src/plantSearch.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("../../plantas-rio-content-editor/node_modules/playwright-core");
const artifacts = resolve("backups/guide-search-2026-11-11");
const plants = JSON.parse(readFileSync(resolve('src/data/plants.json'), 'utf8')).plants;
const expected = plants.filter(createPlantSearch(plants)('pau-brasil')).filter(p => p.photos.length).map(p => `plant-grid-${p.id}`);
mkdirSync(artifacts, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto("http://127.0.0.1:8083", { waitUntil: "domcontentloaded", timeout: 120000 });
  const input = page.getByLabel("Buscar plantas ou unidades de conservação", { exact: true });
  await input.waitFor();
  await page.locator('[data-testid^="plant-grid-"]').first().waitFor();
  const session = await context.newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await page.evaluate(() => {
    window.__searchProgressSeen = 0;
    new MutationObserver(() => {
      if (document.querySelector('[data-testid="guide-search-loading"]')) window.__searchProgressSeen++;
    }).observe(document.body, { childList: true, subtree: true });
  });
  await input.fill("juçara");
  await page.getByTestId("plant-grid-euterpe-edulis").waitFor();
  await page.getByTestId("guide-search-loading").waitFor({ state: "hidden" });
  await input.fill("mangue");
  await page.getByTestId("plant-grid-rhizophora-mangle").waitFor();
  await input.fill("ju");
  await input.fill("pau-brasil");
  await page.getByTestId("plant-grid-paubrasilia-echinata").waitFor();
  await page.getByTestId("guide-search-loading").waitFor({ state: "hidden" });
  await page.waitForFunction((expected) => {
    const cards = [...document.querySelectorAll('[data-testid^="plant-grid-"]')];
    return cards.length === expected.length && cards.every(card => expected.includes(card.getAttribute('data-testid')));
  }, expected).catch(async (error) => {
    console.log('Search diagnostic:', await page.evaluate(() => ({ input: document.querySelector('input')?.value,
      cards: [...document.querySelectorAll('[data-testid^="plant-grid-"]')].map(el => el.getAttribute('data-testid')) })));
    await page.screenshot({ path: resolve(artifacts, 'failure.png') });
    throw error;
  });
  assert.equal(await input.inputValue(), "pau-brasil");
  assert.equal(await page.locator('[data-testid^="plant-grid-"]').count(), expected.length);
  await input.fill("zzzz-no-such-plant");
  await page.getByText("Nenhuma planta encontrada.", { exact: true }).waitFor();
  await page.getByTestId("guide-search-loading").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Limpar busca", exact: true }).click();
  await page.getByTestId("guide-search-loading").waitFor({ state: "hidden" });
  await page.locator('[data-testid^="plant-grid-"]').nth(2).waitFor();
  assert.equal(await input.inputValue(), "");
  const boxes = await Promise.all([0, 1, 2].map((i) => page.locator('[data-testid^="plant-grid-"]').nth(i).boundingBox()));
  assert.ok(boxes.every((box) => box && Math.abs(box.y - boxes[0].y) < 2), "Three-column grid remains intact");
  const spinnerObservations = await page.evaluate(() => window.__searchProgressSeen);
  assert.ok(spinnerObservations > 0, "Loading indicator must appear while results update");
  assert.deepEqual(errors, []);
  await page.screenshot({ path: resolve(artifacts, "guide-after-search.png") });
  const report = { browser: "isolated Chrome context", viewport: "390x844", cpuThrottle: 6,
    spinnerObservations, accentSearch: true, rapidQueryLatestWins: true, emptyAndClear: true, threeColumns: true, pageErrors: errors };
  writeFileSync(resolve(artifacts, "result.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
