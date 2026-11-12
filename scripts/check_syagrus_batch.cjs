const { chromium } = require('../../plantas-rio-content-editor/node_modules/playwright-core');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const catalog = JSON.parse(fs.readFileSync('src/data/plants.json', 'utf8'));
const siteUrl = process.env.PLANT_SITE_URL || 'http://127.0.0.1:8893';
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const errors = [], failures = [], checked = [];
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.addInitScript(() => localStorage.setItem('plantas-do-rio-state-v1', JSON.stringify({ advanced: false, alphabetical: false, photosOnly: false, lists: [{ id: 'minha-lista', name: 'Minha lista', plantIds: [] }], familyFilter: null })));
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(String(error)));
      page.on('response', response => { if (response.url().startsWith(siteUrl) && response.status() >= 400) failures.push(response.url()); });
      await page.goto(siteUrl + '/', { waitUntil: 'domcontentloaded' });
      const bundleUrl = await page.locator('script[src]').first().getAttribute('src');
      const bundleResponse = await page.request.get(new URL(bundleUrl, siteUrl).href);
      assert.equal(crypto.createHash('sha256').update(await bundleResponse.body()).digest('hex'), '3c4c72c9178878fd7c94003d26944e1a9ebddc42b7f79994b3aa024a6da5455d');
      for (const id of ['syagrus-picrophylla', 'syagrus-weddelliana', 'syagrus-pseudococos', 'syagrus-insignis', 'syagrus-macrocarpa']) {
        const plant = catalog.plants.find(p => p.id === id);
        await page.getByLabel('Buscar plantas ou unidades de conservação', { exact: true }).fill(plant.scientificName);
        await page.getByTestId(`plant-grid-${id}`).click({ timeout: 30000 });
        await page.getByText(plant.description, { exact: true }).waitFor();
        await page.getByText(plant.identification, { exact: true }).waitFor();
        checked.push({ width, id });
        await page.getByRole('tab', { name: 'Guia', exact: true }).click();
      }
      await context.close();
    }
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
    console.log(JSON.stringify({ checked, errors, failures }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
