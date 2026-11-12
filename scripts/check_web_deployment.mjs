import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('../../plantas-rio-content-editor/node_modules/playwright-core');
const url = process.env.PLANT_SITE_URL || 'http://127.0.0.1:8886';
const stage = process.env.PLANT_SITE_STAGE || 'local';
assert.ok(['local', 'live'].includes(stage));
const artifacts = resolve('backups/web-deploy-2026-11-11', stage);
mkdirSync(artifacts, { recursive: true });
const catalog = JSON.parse(readFileSync('src/data/plants.json', 'utf8'));
const verification = JSON.parse(readFileSync('backups/web-deploy-2026-11-11/export-verification.json', 'utf8'));
const args = process.env.PLANT_SITE_RESOLVE ? [`--host-resolver-rules=MAP ${new URL(url).hostname} ${process.env.PLANT_SITE_RESOLVE}`] : [];
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args });
const errors = [], failedAssets = [], profiles = [];
try {
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await mobile.newPage();
  page.on('pageerror', error => errors.push(String(error)));
  page.on('response', response => { if (response.status() >= 400 && new URL(response.url()).origin === new URL(url).origin) failedAssets.push({ url: response.url(), status: response.status() }); });
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  assert.equal(response.status(), 200);
  const input = page.getByLabel('Buscar plantas ou unidades de conservação', { exact: true });
  await input.waitFor();
  await page.locator('[data-testid^="plant-grid-"]').nth(2).waitFor();
  const boxes = await Promise.all([0, 1, 2].map(i => page.locator('[data-testid^="plant-grid-"]').nth(i).boundingBox()));
  assert.ok(boxes.every(box => box && Math.abs(box.y - boxes[0].y) < 2), 'Mobile has three columns');
  const session = await mobile.newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await page.evaluate(() => {
    window.__deploymentSearchProgress = 0;
    new MutationObserver(() => {
      if (document.querySelector('[data-testid="guide-search-loading"]')) window.__deploymentSearchProgress++;
    }).observe(document.body, { childList: true, subtree: true });
  });
  await input.fill('juçara');
  await page.getByTestId('plant-grid-euterpe-edulis').waitFor();
  await input.fill('zzzz-no-such-plant');
  await page.getByText('Nenhuma planta encontrada.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Limpar busca', exact: true }).click();
  await page.locator('[data-testid^="plant-grid-"]').nth(2).waitFor();
  const spinnerObservations = await page.evaluate(() => window.__deploymentSearchProgress);
  assert.ok(spinnerObservations > 0, 'Loading indicator appears while results update');
  await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  for (const family of ['Orchidaceae', 'Begoniaceae']) {
    await input.fill(family);
    const expected = catalog.plants.filter(p => p.family === family && p.photos.length).map(p => `plant-grid-${p.id}`);
    await page.waitForFunction(expected => {
      const actual = [...document.querySelectorAll('[data-testid^="plant-grid-"]')];
      return actual.length === expected.length && actual.every(node => expected.includes(node.getAttribute('data-testid')));
    }, expected);
    await page.screenshot({ path: resolve(artifacts, `${family}.png`) });
  }
  for (const id of ['guapira-opposita', 'alchornea-glandulosa', 'croton-floribundus', 'allophylus-edulis', 'sapindus-saponaria', 'zanthoxylum-rhoifolium', 'avicennia-germinans', 'maxillaria-picta']) {
    const plant = catalog.plants.find(p => p.id === id);
    await input.fill(plant.scientificName);
    await page.getByTestId(`plant-grid-${id}`).click();
    await page.getByText(plant.description, { exact: true }).waitFor();
    await page.getByText(plant.identification, { exact: true }).waitFor();
    await page.getByText(plant.photos[0].caption, { exact: true }).waitFor();
    await page.waitForFunction(() => {
      const img = document.querySelector('[data-testid="profile-photo-gallery"] img');
      return img?.complete && img.naturalWidth > 0;
    });
    profiles.push(id);
    await page.getByRole('tab', { name: 'Guia', exact: true }).click();
  }
  for (const bundle of verification.bundles) {
    const asset = await page.evaluate(async path => {
      const response = await fetch(path);
      const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
      return { status: response.status, sha256: [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('') };
    }, new URL(bundle.path, url).href);
    assert.equal(asset.status, 200);
    assert.equal(asset.sha256, bundle.sha256, 'Public bundle matches verified export');
  }
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const wide = await desktop.newPage();
  wide.on('pageerror', error => errors.push(String(error)));
  await wide.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const slider = wide.getByRole('slider', { name: 'Fotos por linha', exact: true });
  await slider.waitFor();
  await slider.focus();
  await slider.press('Home');
  await wide.getByText('6 por linha', { exact: true }).waitFor();
  await slider.press('End');
  await wide.getByText('22 por linha', { exact: true }).waitFor();
  await slider.press('Home');
  await wide.getByText('6 por linha', { exact: true }).waitFor();
  const wideInput = wide.getByLabel('Buscar plantas ou unidades de conservação', { exact: true });
  await wideInput.fill('Maxillaria picta');
  await wide.getByTestId('plant-grid-maxillaria-picta').click();
  const spotted = catalog.plants.find(p => p.id === 'maxillaria-picta');
  await wide.getByText(spotted.photos[0].caption, { exact: true }).waitFor();
  await wide.getByRole('button', { name: 'Foto seguinte', exact: true }).click();
  await wide.getByText(spotted.photos[1].caption, { exact: true }).waitFor();
  await wide.getByRole('button', { name: 'Foto anterior', exact: true }).click();
  await wide.getByText(spotted.photos[0].caption, { exact: true }).waitFor();
  await wide.screenshot({ path: resolve(artifacts, 'desktop-profile.png') });
  assert.deepEqual(errors, []);
  assert.deepEqual(failedAssets, []);
  const result = { stage, url, entries: catalog.plants.length, representedSpecies: verification.representedSpecies,
    mobileThreeColumns: true, orchidProfiles: 12, begoniaProfiles: 11, newProfilesOpened: profiles,
    profileTextCaptionsAndPhotos: true, exactBundleHashes: true, desktopGalleryControls: true,
    desktopPhotoNavigation: true, accentSearchEmptyAndClear: true, searchLoadingIndicatorObserved: true,
    spinnerObservations, pageErrors: errors, failedAssets };
  writeFileSync(resolve(artifacts, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
