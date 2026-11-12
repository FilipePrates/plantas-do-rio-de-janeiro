const { chromium } = require('../../plantas-rio-content-editor/node_modules/playwright-core');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const catalog = JSON.parse(readFileSync('src/data/plants.json', 'utf8'));
const ids = JSON.parse(readFileSync('sources/workbook-batch-2026-11-12/added.json', 'utf8')).addedPlantIds;
const report = JSON.parse(readFileSync('sources/workbook-batch-2026-11-12/export-verification.json', 'utf8'));
const site = process.env.PLANT_SITE_URL || 'http://127.0.0.1:8894';
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const errors = [], failures = [], checked = [];
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(String(e)));
      page.on('response', r => { if (r.url().startsWith(site) && r.status() >= 400) failures.push(r.url()); });
      await page.goto(site + '/', { waitUntil: 'domcontentloaded' });
      const src = await page.locator('script[src]').first().getAttribute('src');
      const bundle = await page.request.get(new URL(src, site).href);
      assert.equal(createHash('sha256').update(await bundle.body()).digest('hex'), report.bundles[0].sha256);
      for (const id of ids) {
        const p = catalog.plants.find(p => p.id === id);
        await page.getByLabel('Buscar plantas ou unidades de conservação', { exact: true }).fill(p.scientificName);
        await page.getByTestId(`plant-grid-${id}`).click({ timeout: 30000 });
        await page.getByText(p.description, { exact: true }).waitFor();
        await page.waitForFunction(() => { const i = document.querySelector('[data-testid="profile-photo-gallery"] img'); return i && i.complete && i.naturalWidth > 0; });
        checked.push({ width, id });
        await page.getByRole('tab', { name: 'Guia', exact: true }).click();
      }
      await context.close();
    }
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
    console.log(JSON.stringify({ checked, errors, failures }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
